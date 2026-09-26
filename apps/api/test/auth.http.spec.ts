import { randomBytes } from 'node:crypto';
import { Writable } from 'node:stream';
import pino from 'pino';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import { EmailCrypto } from '../src/modules/auth/email-crypto.js';
import { EmailRepository } from '../src/modules/auth/email.repository.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_http_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = new DataSource({
  ...createDataSource({ ...env, DB_NAME: database }).options,
  migrations: [
    CreateAuthentication20260924221500,
    CreateEmailVerification20260924230000,
  ],
});
const lines: string[] = [];
const stream = new Writable({
  write(chunk, _encoding, callback) {
    lines.push(String(chunk));
    callback();
  },
});
const logger = pino({ level: 'info' }, stream);
const app = createApp({ logger, webOrigin: env.WEB_ORIGIN, source, env });
const origin = env.WEB_ORIGIN;
const password = 'correct-horse-battery';
const email = `auth-${randomBytes(5).toString('hex')}@example.com`;

function issuedCookie(
  header: string | string[] | undefined,
  name = 'edutrack_session',
): string {
  const raw = (Array.isArray(header) ? header : header ? [header] : []).find(
    (value) => value.startsWith(`${name}=`) && !value.startsWith(`${name}=;`),
  );
  if (!raw) throw new Error('Session cookie missing');
  return raw.split(';')[0]!;
}

const delivery = new EmailRepository(
  source,
  new EmailCrypto(env.EMAIL_HMAC_KEY!, env.EMAIL_ENCRYPTION_KEY!),
);
async function verifyRegistration(
  verificationCookie: string,
  targetEmail: string,
): Promise<void> {
  let code = '';
  for (let attempt = 0; attempt < 20 && !code; attempt += 1)
    if (
      !(await delivery.deliverOne(async (address, sentCode) => {
        if (address === targetEmail) code = sentCode;
      }))
    )
      break;
  expect(code).toMatch(/^\d{6}$/);
  const confirmed = await request(app)
    .post('/auth/email-verification/confirm')
    .set('Origin', origin)
    .set('Cookie', verificationCookie)
    .send({ code });
  expect(confirmed.status).toBe(204);
}

beforeAll(async () => {
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  await source.initialize();
  await source.runMigrations();
});

afterAll(async () => {
  if (source.isInitialized) await source.destroy();
  if (admin.isInitialized) {
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.destroy();
  }
});

describe('authentication HTTP with MySQL', () => {
  let cookie: string;

  it('registers a local user, stores only a hash, and rejects duplicates', async () => {
    const registered = await request(app)
      .post('/auth/register')
      .set('Origin', origin)
      .send({ email: `  ${email.toUpperCase()}  `, password });
    expect(registered.status).toBe(201);
    expect(registered.body.pendingVerification).toBe(true);
    const verificationCookie = issuedCookie(
      registered.headers['set-cookie'],
      'edutrack_verify',
    );
    expect(String(registered.headers['set-cookie'])).toContain('HttpOnly');
    expect(String(registered.headers['set-cookie'])).toContain('SameSite=Lax');
    const sessionRows = await source.query('SELECT token_hash FROM sessions');
    expect(sessionRows).toHaveLength(0);
    expect(
      (await request(app).get('/auth/me').set('Cookie', verificationCookie))
        .status,
    ).toBe(401);
    const rows = await source.query(
      'SELECT password_hash, salt FROM password_credentials',
    );
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(password);
    const duplicate = await request(app)
      .post('/auth/register')
      .set('Origin', origin)
      .send({ email, password });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('EMAIL_UNAVAILABLE');
    await verifyRegistration(verificationCookie, email);
    const firstLogin = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email, password });
    expect(firstLogin.status).toBe(200);
    cookie = issuedCookie(firstLogin.headers['set-cookie']);
    expect(
      JSON.stringify(await source.query('SELECT token_hash FROM sessions')),
    ).not.toContain(cookie.split('=')[1]);
  });

  it('uses generic login failure, persists the session, and revokes on logout', async () => {
    const wrong = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email, password: 'wrong-password' });
    const absent = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email: 'absent@example.com', password: 'wrong-password' });
    expect(wrong.status).toBe(401);
    expect(absent.status).toBe(401);
    expect(wrong.body).toEqual(absent.body);
    const loggedIn = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .set('Cookie', cookie)
      .send({ email, password });
    expect(loggedIn.status).toBe(200);
    const nextCookie = issuedCookie(loggedIn.headers['set-cookie']);
    expect(
      await request(app)
        .get('/auth/me')
        .set('Cookie', cookie)
        .then((r) => r.status),
    ).toBe(401);
    const me = await request(app).get('/auth/me').set('Cookie', nextCookie);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(email);
    expect(
      (
        await request(app)
          .post('/auth/logout')
          .set('Origin', origin)
          .set('Cookie', nextCookie)
          .send({})
      ).status,
    ).toBe(204);
    expect(
      (await request(app).get('/auth/me').set('Cookie', nextCookie)).status,
    ).toBe(401);
    expect((await request(app).get('/auth/me')).status).toBe(401);
  });

  it('rejects absent origin and non-JSON state changes', async () => {
    expect(
      (await request(app).post('/auth/login').send({ email, password })).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/auth/login')
          .set('Origin', origin)
          .set('Content-Type', 'text/plain')
          .send('x')
      ).status,
    ).toBe(415);
    expect(lines.join('')).not.toContain(password);
    expect(lines.join('')).not.toContain(cookie);
  });

  it('expires idle sessions in the database', async () => {
    const loggedIn = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email, password });
    const idleCookie = issuedCookie(loggedIn.headers['set-cookie']);
    await source.query(
      'UPDATE sessions SET last_used_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 25 HOUR) WHERE revoked_at IS NULL',
    );
    expect(
      (await request(app).get('/auth/me').set('Cookie', idleCookie)).status,
    ).toBe(401);
    const next = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email, password });
    const absoluteCookie = issuedCookie(next.headers['set-cookie']);
    await source.query(
      'UPDATE sessions SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE revoked_at IS NULL',
    );
    expect(
      (await request(app).get('/auth/me').set('Cookie', absoluteCookie)).status,
    ).toBe(401);
  });

  it('persists the login limit across app instances and recovers after the window', async () => {
    const target = `limited-${randomBytes(5).toString('hex')}@example.com`;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app)
        .post('/auth/login')
        .set('Origin', origin)
        .send({ email: target, password: 'wrong-password' });
      expect(response.status).toBe(401);
    }
    const otherInstance = createApp({ logger, webOrigin: origin, source, env });
    const blocked = await request(otherInstance)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email: target, password: 'wrong-password' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    await source.query(
      'UPDATE auth_rate_limits SET window_end = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND)',
    );
    const recovered = await request(otherInstance)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email: target, password: 'wrong-password' });
    expect(recovered.status).toBe(401);
  });

  it('limits repeated registration and restores capacity after expiry', async () => {
    const target = `registered-${randomBytes(5).toString('hex')}@example.com`;
    expect(
      (
        await request(app)
          .post('/auth/register')
          .set('Origin', origin)
          .send({ email: target, password })
      ).status,
    ).toBe(201);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(
        (
          await request(app)
            .post('/auth/register')
            .set('Origin', origin)
            .send({ email: target, password })
        ).status,
      ).toBe(409);
    }
    expect(
      (
        await request(app)
          .post('/auth/register')
          .set('Origin', origin)
          .send({ email: target, password })
      ).status,
    ).toBe(429);
    await source.query(
      'UPDATE auth_rate_limits SET window_end = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND)',
    );
    expect(
      (
        await request(app)
          .post('/auth/register')
          .set('Origin', origin)
          .send({ email: target, password })
      ).status,
    ).toBe(409);
  });

  it('returns only the account belonging to each session and renews activity', async () => {
    const otherEmail = `other-${randomBytes(5).toString('hex')}@example.com`;
    const other = await request(app)
      .post('/auth/register')
      .set('Origin', origin)
      .send({ email: otherEmail, password });
    const verificationCookie = issuedCookie(
      other.headers['set-cookie'],
      'edutrack_verify',
    );
    await verifyRegistration(verificationCookie, otherEmail);
    const otherLogin = await request(app)
      .post('/auth/login')
      .set('Origin', origin)
      .send({ email: otherEmail, password });
    const otherCookie = issuedCookie(otherLogin.headers['set-cookie']);
    await source.query(
      'UPDATE sessions SET last_used_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 HOUR) WHERE user_id = ?',
      [
        (
          await source.query('SELECT id FROM users WHERE email = ?', [
            otherEmail,
          ])
        )[0].id,
      ],
    );
    const me = await request(app).get('/auth/me').set('Cookie', otherCookie);
    expect(me.body.user.email).toBe(otherEmail);
    expect(me.body.user.email).not.toBe(email);
    const rows = await source.query(
      'SELECT last_used_at > DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 MINUTE) AS fresh FROM sessions WHERE user_id = ?',
      [
        (
          await source.query('SELECT id FROM users WHERE email = ?', [
            otherEmail,
          ])
        )[0].id,
      ],
    );
    expect(Number(rows[0].fresh)).toBe(1);
  });
});
