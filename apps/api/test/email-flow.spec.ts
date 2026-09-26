import { CreateProfilePreferences20260926160000 } from '../src/database/migrations/20260926160000-CreateProfilePreferences.js';
import { randomBytes } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { EmailCrypto } from '../src/modules/auth/email-crypto.js';
import { EmailRepository } from '../src/modules/auth/email.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_flow_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = new DataSource({
  ...createDataSource({ ...env, DB_NAME: database }).options,
  migrations: [
    CreateAuthentication20260924221500,
    CreateEmailVerification20260924230000,
    CreateProfilePreferences20260926160000,
  ],
});
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
});
const email = new EmailRepository(
  source,
  new EmailCrypto(env.EMAIL_HMAC_KEY!, env.EMAIL_ENCRYPTION_KEY!),
);
const address = `flow-${randomBytes(5).toString('hex')}@example.com`;
const password = 'correct-horse-battery';
const origin = env.WEB_ORIGIN;
const post = (path: string, body: object) =>
  request(app).post(path).set('Origin', origin).send(body);
function cookie(
  response: { headers: Record<string, unknown> },
  name: string,
): string {
  const raw = response.headers['set-cookie'] as string[];
  const found = raw?.find(
    (item) => item.startsWith(`${name}=`) && !item.startsWith(`${name}=;`),
  );
  if (!found) throw new Error(`Missing ${name}`);
  return found.split(';')[0]!;
}
async function deliveredCode(
  target: string,
  purpose?: string,
): Promise<string> {
  let code = '';
  for (let i = 0; i < 20 && !code; i += 1)
    if (
      !(await email.deliverOne(async (recipient, value, deliveredPurpose) => {
        if (recipient === target && (!purpose || purpose === deliveredPurpose))
          code = value;
      }))
    )
      break;
  expect(code).toMatch(/^\d{6}$/);
  return code;
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

describe('email verification and recovery HTTP with MySQL', () => {
  let verificationCookie: string;
  let sessionCookie: string;

  it('keeps a pending local account out of private routes and confirms once', async () => {
    const registered = await post('/auth/register', {
      email: address,
      password,
    });
    expect(registered.status).toBe(201);
    verificationCookie = cookie(registered, 'edutrack_verify');
    const pendingLogin = await post('/auth/login', {
      email: address,
      password,
    });
    expect(pendingLogin.body.pendingVerification).toBe(true);
    expect(
      (await request(app).get('/auth/me').set('Cookie', verificationCookie))
        .status,
    ).toBe(401);
    const previousCode = await deliveredCode(address);
    expect(
      (
        await request(app)
          .post('/auth/email-verification/resend')
          .set('Origin', origin)
          .set('Cookie', verificationCookie)
          .send({})
      ).status,
    ).toBe(429);
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    expect(
      (
        await request(app)
          .post('/auth/email-verification/resend')
          .set('Origin', origin)
          .set('Cookie', verificationCookie)
          .send({})
      ).status,
    ).toBe(202);
    const code = await deliveredCode(address);
    expect(
      (
        await request(app)
          .post('/auth/email-verification/confirm')
          .set('Origin', origin)
          .set('Cookie', verificationCookie)
          .send({ code: previousCode })
      ).status,
    ).toBe(400);
    const confirmed = await request(app)
      .post('/auth/email-verification/confirm')
      .set('Origin', origin)
      .set('Cookie', verificationCookie)
      .send({ code });
    expect(confirmed.status).toBe(204);
    expect(
      (
        await request(app)
          .post('/auth/email-verification/confirm')
          .set('Origin', origin)
          .set('Cookie', verificationCookie)
          .send({ code })
      ).status,
    ).toBe(401);
    const login = await post('/auth/login', { email: address, password });
    expect(login.body.user.email).toBe(address);
    sessionCookie = cookie(login, 'edutrack_session');
    expect(
      (await request(app).get('/auth/me').set('Cookie', sessionCookie)).status,
    ).toBe(200);
    const userId = login.body.user.id as string;
    const staleContext = await email.context(userId);
    expect(
      (
        await request(app)
          .post('/auth/email-verification/resend')
          .set('Origin', origin)
          .set('Cookie', `edutrack_verify=${staleContext}`)
          .send({})
      ).status,
    ).toBe(409);
  });

  it('returns one recovery response for local, Google-only and unknown accounts', async () => {
    const googleAddress = `google-${randomBytes(5).toString('hex')}@example.com`;
    await new AuthRepository(source).createGoogle(
      googleAddress,
      randomBytes(12).toString('hex'),
      googleAddress,
    );
    const first = await post('/auth/password-recovery/request', {
      email: address,
    });
    const google = await post('/auth/password-recovery/request', {
      email: googleAddress,
    });
    const missingAddress = `absent-${randomBytes(5).toString('hex')}@example.com`;
    const missing = await post('/auth/password-recovery/request', {
      email: missingAddress,
    });
    expect(first.status).toBe(202);
    expect(google.body).toEqual(first.body);
    expect(missing.body).toEqual(first.body);
    expect(first.body.message).toContain('Google');
    const queued = await source.query(
      "SELECT COUNT(*) AS count FROM email_challenges WHERE purpose = 'reset_password'",
    );
    expect(Number(queued[0].count)).toBe(1);
    const limited = await Promise.all(
      [address, googleAddress, missingAddress].map((target) =>
        post('/auth/password-recovery/request', { email: target }),
      ),
    );
    expect(limited.map((result) => result.status)).toEqual([429, 429, 429]);
    expect(limited[1]?.body).toEqual(limited[0]?.body);
    expect(limited[2]?.body).toEqual(limited[0]?.body);
    expect(Number(limited[0]?.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('uses a short one-time grant, changes password and revokes old sessions', async () => {
    const code = await deliveredCode(address);
    const verified = await post('/auth/password-recovery/verify', {
      email: address,
      code,
    });
    expect(verified.status).toBe(204);
    const grant = cookie(verified, 'edutrack_reset');
    expect(
      (await post('/auth/password-recovery/verify', { email: address, code }))
        .status,
    ).toBe(400);
    const reset = await request(app)
      .post('/auth/password-recovery/reset')
      .set('Origin', origin)
      .set('Cookie', grant)
      .send({ password: 'new-correct-horse-battery' });
    expect(reset.status).toBe(204);
    expect(
      (await request(app).get('/auth/me').set('Cookie', sessionCookie)).status,
    ).toBe(401);
    expect(
      (
        await post('/auth/password-recovery/reset', {
          password: 'another-correct-horse',
        }).set('Cookie', grant)
      ).status,
    ).toBe(401);
    expect(
      (await post('/auth/login', { email: address, password })).status,
    ).toBe(401);
    expect(
      (
        await post('/auth/login', {
          email: address,
          password: 'new-correct-horse-battery',
        })
      ).status,
    ).toBe(200);
  });

  it('blocks five wrong codes and expiration, including concurrent consumption', async () => {
    const target = `limit-${randomBytes(5).toString('hex')}@example.com`;
    const registered = await post('/auth/register', {
      email: target,
      password,
    });
    const context = cookie(registered, 'edutrack_verify');
    const code = await deliveredCode(target);
    const wrong = code === '000000' ? '999999' : '000000';
    for (let i = 0; i < 5; i += 1)
      expect(
        (
          await request(app)
            .post('/auth/email-verification/confirm')
            .set('Origin', origin)
            .set('Cookie', context)
            .send({ code: wrong })
        ).status,
      ).toBe(400);
    expect(
      (
        await request(app)
          .post('/auth/email-verification/confirm')
          .set('Origin', origin)
          .set('Cookie', context)
          .send({ code })
      ).status,
    ).toBe(400);
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    expect(
      (
        await request(app)
          .post('/auth/email-verification/resend')
          .set('Origin', origin)
          .set('Cookie', context)
          .send({})
      ).status,
    ).toBe(202);
    const replacement = await deliveredCode(target);
    await source.query(
      'UPDATE email_challenges SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE user_id = (SELECT id FROM users WHERE email = ?) AND active_marker = 1',
      [target],
    );
    expect(
      (
        await request(app)
          .post('/auth/email-verification/confirm')
          .set('Origin', origin)
          .set('Cookie', context)
          .send({ code: replacement })
      ).status,
    ).toBe(400);
    await source.query(
      'UPDATE email_challenges SET expires_at = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 10 MINUTE) WHERE user_id = (SELECT id FROM users WHERE email = ?) AND active_marker = 1',
      [target],
    );
    const results = await Promise.all(
      [0, 1].map(() =>
        request(app)
          .post('/auth/email-verification/confirm')
          .set('Origin', origin)
          .set('Cookie', context)
          .send({ code: replacement }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([204, 400]);
  });

  it('confirms a pending email during recovery and permits only one concurrent reset', async () => {
    const target = `pending-${randomBytes(5).toString('hex')}@example.com`;
    await post('/auth/register', { email: target, password });
    expect(
      (await post('/auth/password-recovery/request', { email: target })).status,
    ).toBe(202);
    const code = await deliveredCode(target, 'reset_password');
    const verified = await post('/auth/password-recovery/verify', {
      email: target,
      code,
    });
    const grant = cookie(verified, 'edutrack_reset');
    const previousCredential = await new AuthRepository(source).passwordByEmail(
      target,
    );
    expect(
      (
        await post('/auth/password-recovery/reset', { password: 'short' }).set(
          'Cookie',
          grant,
        )
      ).status,
    ).toBe(400);
    const results = await Promise.all(
      [0, 1].map(() =>
        post('/auth/password-recovery/reset', {
          password: 'concurrent-new-password',
        }).set('Cookie', grant),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([204, 401]);
    const login = await post('/auth/login', {
      email: target,
      password: 'concurrent-new-password',
    });
    expect(login.status).toBe(200);
    expect(login.body.user.email).toBe(target);
    expect(
      (await post('/auth/login', { email: target, password })).status,
    ).toBe(401);
    await expect(
      new SessionRepository(source).create(
        previousCredential!.userId,
        undefined,
        previousCredential!.hash,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('rejects expired recovery grants and codes without changing the password', async () => {
    const target = `expired-${randomBytes(5).toString('hex')}@example.com`;
    await post('/auth/register', { email: target, password });
    await post('/auth/password-recovery/request', { email: target });
    const blockedCode = await deliveredCode(target, 'reset_password');
    const wrongCode = blockedCode === '000000' ? '999999' : '000000';
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const wrong = await post('/auth/password-recovery/verify', {
        email: target,
        code: wrongCode,
      });
      expect(wrong.status).toBe(400);
      expect(wrong.headers['set-cookie']).toBeUndefined();
    }
    expect(
      (
        await post('/auth/password-recovery/verify', {
          email: target,
          code: blockedCode,
        })
      ).status,
    ).toBe(400);
    await source.query(
      'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
    );
    await post('/auth/password-recovery/request', { email: target });
    const code = await deliveredCode(target, 'reset_password');
    await source.query(
      "UPDATE email_challenges SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE user_id = (SELECT id FROM users WHERE email = ?) AND purpose = 'reset_password'",
      [target],
    );
    const expired = await post('/auth/password-recovery/verify', {
      email: target,
      code,
    });
    expect(expired.status).toBe(400);
    expect(expired.headers['set-cookie']).toBeUndefined();
    await source.query(
      "UPDATE email_challenges SET expires_at = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 10 MINUTE) WHERE user_id = (SELECT id FROM users WHERE email = ?) AND purpose = 'reset_password'",
      [target],
    );
    const verified = await post('/auth/password-recovery/verify', {
      email: target,
      code,
    });
    const grant = cookie(verified, 'edutrack_reset');
    await source.query(
      'UPDATE reset_grants SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE user_id = (SELECT id FROM users WHERE email = ?)',
      [target],
    );
    expect(
      (
        await post('/auth/password-recovery/reset', {
          password: 'unused-new-password',
        }).set('Cookie', grant)
      ).status,
    ).toBe(401);
    expect(
      (await post('/auth/login', { email: target, password })).body
        .pendingVerification,
    ).toBe(true);
  });

  it('rolls back account creation when the confirmation emission is limited', async () => {
    const target = `rollback-${randomBytes(5).toString('hex')}@example.com`;
    const key = new EmailCrypto(
      env.EMAIL_HMAC_KEY!,
      env.EMAIL_ENCRYPTION_KEY!,
    ).digest('rate:verify_email:ip', '::ffff:127.0.0.1');
    await source.query(
      'UPDATE email_rate_limits SET attempts = 30 WHERE rate_key = ?',
      [key],
    );
    expect(
      (await post('/auth/register', { email: target, password })).status,
    ).toBe(429);
    expect(
      await source.query('SELECT id FROM users WHERE email = ?', [target]),
    ).toHaveLength(0);
    await source.query(
      'UPDATE email_rate_limits SET attempts = 0 WHERE rate_key = ?',
      [key],
    );
  });

  it('keeps origin validation limits across instances even for unknown accounts', async () => {
    const key = new EmailCrypto(
      env.EMAIL_HMAC_KEY!,
      env.EMAIL_ENCRYPTION_KEY!,
    ).digest('rate:reset_password:validation:ip', '::ffff:127.0.0.1');
    await source.query(
      'UPDATE email_rate_limits SET attempts = 100 WHERE rate_key = ?',
      [key],
    );
    const otherApp = createApp({
      logger: pino({ level: 'silent' }),
      webOrigin: origin,
      source,
      env,
    });
    const blocked = await request(otherApp)
      .post('/auth/password-recovery/verify')
      .set('Origin', origin)
      .send({ email: 'missing@example.com', code: '123456' });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    expect(
      (
        await request(otherApp)
          .post('/auth/password-recovery/request')
          .send({ email: address })
      ).status,
    ).toBe(403);
  });
});
