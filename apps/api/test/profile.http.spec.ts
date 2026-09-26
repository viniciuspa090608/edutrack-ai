import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import pino from 'pino';
import request from 'supertest';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { EmailCrypto } from '../src/modules/auth/email-crypto.js';
import { EmailRepository } from '../src/modules/auth/email.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { RateLimitRepository } from '../src/modules/auth/rate-limit.repository.js';
import { hashPassword } from '../src/modules/auth/password.js';
import {
  authenticatedSession,
  requireSession,
} from '../src/modules/auth/auth.routes.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { errorHandler } from '../src/middlewares/error-handler.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_profile_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
const logger = pino({ level: 'silent' });
const app = createApp({ logger, webOrigin: env.WEB_ORIGIN, source, env });
const users = new AuthRepository(source);
const sessions = new SessionRepository(source);
const delivery = new EmailRepository(
  source,
  new EmailCrypto(env.EMAIL_HMAC_KEY!, env.EMAIL_ENCRYPTION_KEY!),
);
const prefs = new PreferencesService(source);
const password = 'correct-horse-battery';
const write = (path: string, cookie: string, body: object = {}) =>
  request(app)
    .post(`/profile${path}`)
    .set('Origin', env.WEB_ORIGIN)
    .set('Cookie', cookie)
    .send(body);
const patch = (path: string, cookie: string, body: object) =>
  request(app)
    .patch(`/profile${path}`)
    .set('Origin', env.WEB_ORIGIN)
    .set('Cookie', cookie)
    .send(body);
async function account(googleOnly = false) {
  const email = `${randomUUID()}@example.com`;
  const subject = randomUUID();
  const secret = await hashPassword(password);
  const user = googleOnly
    ? await users.createGoogle(email, subject, email)
    : await users.createLocal(email, secret.hash, secret.salt);
  await source.query(
    'UPDATE users SET email_verified_at = UTC_TIMESTAMP(3) WHERE id = ?',
    [user.id],
  );
  const token = await sessions.create(user.id);
  return { ...user, subject, token, cookie: `edutrack_session=${token}` };
}
async function codeFor(address: string): Promise<string> {
  let code = '';
  for (let i = 0; i < 30 && !code; i++) {
    if (
      !(await delivery.deliverOne(async (email, value, purpose) => {
        if (email === address && purpose === 'change_email') code = value;
      }))
    )
      break;
  }
  expect(code).toMatch(/^\d{6}$/);
  return code;
}
async function start(cookie: string, email: string) {
  expect(
    (await write('/identity/password', cookie, { currentPassword: password }))
      .status,
  ).toBe(204);
  return write('/email/request', cookie, { email });
}
const releaseRate = () =>
  source.query(
    'UPDATE email_rate_limits SET last_issued_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 61 SECOND)',
  );
async function recoveryGrant(userId: string, address: string): Promise<string> {
  await delivery.issue(userId, address, 'reset_password', 'test');
  let code = '';
  for (let i = 0; i < 30 && !code; i++)
    if (
      !(await delivery.deliverOne(async (email, value, purpose) => {
        if (email === address && purpose === 'reset_password') code = value;
      }))
    )
      break;
  const grant = await delivery.consume(userId, 'reset_password', code);
  if (!grant) throw new Error('Missing recovery grant');
  return grant;
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

describe('own profile and module preferences on MySQL', () => {
  it('keeps at least one study module active, including concurrent requests and with AI enabled', async () => {
    const a = await account();
    expect(
      (
        await patch('/preferences', a.cookie, {
          tasks: true,
          subjects: false,
          flashcards: false,
          ai: true,
        })
      ).status,
    ).toBe(200);
    const invalid = await patch('/preferences', a.cookie, { tasks: false });
    expect(invalid.status).toBe(409);
    expect(invalid.body.error.code).toBe('LAST_MODULE_REQUIRED');
    expect(await prefs.read(a.id)).toEqual({
      tasks: true,
      subjects: false,
      flashcards: false,
      ai: true,
    });
    expect(
      (
        await patch('/preferences', a.cookie, {
          tasks: false,
          subjects: false,
          flashcards: false,
          ai: false,
        })
      ).status,
    ).toBe(409);
    expect(
      (await patch('/preferences', a.cookie, { tasks: false, subjects: true }))
        .status,
    ).toBe(200);
    await prefs.update(a.id, { tasks: true });
    const outcomes = await Promise.all([
      patch('/preferences', a.cookie, { tasks: false }),
      patch('/preferences', a.cookie, { subjects: false }),
    ]);
    expect(outcomes.map((r) => r.status).sort()).toEqual([200, 409]);
    const saved = await prefs.read(a.id);
    expect(saved.tasks || saved.subjects || saved.flashcards).toBe(true);
    expect(saved.ai).toBe(true);
  });
  it('normalizes repeatable names, rejects invalid/foreign fields and never exposes the blob', async () => {
    const a = await account();
    const b = await account();
    for (const user of [a, b]) {
      const updated = await patch('', user.cookie, {
        displayName: '  Ana\u0301  ',
      });
      expect(updated.status).toBe(200);
      expect(updated.body.displayName).toBe('Aná');
      expect(updated.body.id).toBe(user.id);
    }
    for (const body of [
      { displayName: 'a' },
      { displayName: 'a'.repeat(61) },
      { displayName: 'a\nb' },
      { displayName: 'Ana', id: b.id },
    ])
      expect((await patch('', a.cookie, body)).status).toBe(400);
    expect(
      (await request(app).get('/profile').set('Cookie', a.cookie)).body,
    ).not.toHaveProperty('avatar_bytes');
    expect(
      (await request(app).get(`/profile/${b.id}`).set('Cookie', a.cookie))
        .status,
    ).toBe(404);
    expect((await request(app).get('/profile')).status).toBe(401);
    expect(
      (await request(app).get('/auth/me').set('Cookie', a.cookie)).body.user
        .displayName,
    ).toBe('Aná');
  });
  it('validates and reencodes all photo formats, rejects hostile inputs and removes own bytes', async () => {
    const a = await account();
    const b = await account();
    const upload = (bytes: Buffer, mime: string) =>
      request(app)
        .put('/profile/avatar')
        .set('Origin', env.WEB_ORIGIN)
        .set('Cookie', a.cookie)
        .set('Content-Type', mime)
        .send(bytes);
    for (const format of ['jpeg', 'png', 'webp'] as const) {
      const bytes = await sharp({
        create: { width: 800, height: 600, channels: 3, background: '#aabbcc' },
      })
        .toFormat(format)
        .toBuffer();
      expect((await upload(bytes, `image/${format}`)).status).toBe(200);
    }
    const stored = await source.query(
      'SELECT avatar_bytes, avatar_mime FROM users WHERE id = ?',
      [a.id],
    );
    expect(stored[0].avatar_mime).toBe('image/webp');
    const metadata = await sharp(stored[0].avatar_bytes).metadata();
    expect(metadata.width).toBe(512);
    expect(metadata.exif).toBeUndefined();
    const small = await sharp({
      create: { width: 63, height: 64, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    const large = await sharp({
      create: { width: 4097, height: 64, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    const pixels = await sharp({
      create: { width: 4096, height: 4096, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    const png = await sharp({
      create: { width: 64, height: 64, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    const frames = Buffer.alloc(64 * 128 * 3);
    frames.fill(255, 64 * 64 * 3);
    const animated = await sharp(frames, {
      raw: { width: 64, height: 128, channels: 3, pageHeight: 64 },
    })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();
    expect((await sharp(animated).metadata()).pages).toBe(2);
    for (const [bytes, mime] of [
      [Buffer.from('<svg/>'), 'image/png'],
      [Buffer.from('corrupt'), 'image/jpeg'],
      [small, 'image/png'],
      [large, 'image/png'],
      [pixels, 'image/png'],
      [png, 'image/jpeg'],
      [animated, 'image/webp'],
    ] as const)
      expect((await upload(bytes, mime)).status).toBe(400);
    expect(
      (await upload(Buffer.alloc(2 * 1024 * 1024 + 1), 'image/png')).status,
    ).toBe(413);
    expect(
      (
        await source.query('SELECT avatar_bytes FROM users WHERE id = ?', [
          a.id,
        ])
      )[0].avatar_bytes,
    ).toEqual(stored[0].avatar_bytes);
    const photo = await request(app)
      .get('/profile/avatar')
      .set('Cookie', a.cookie);
    expect(photo.status).toBe(200);
    expect(photo.headers['content-type']).toMatch(/image\/webp/);
    expect(photo.headers['cache-control']).toBe('private, no-store');
    expect(photo.headers['x-content-type-options']).toBe('nosniff');
    expect(
      (await request(app).get('/profile/avatar').set('Cookie', b.cookie))
        .status,
    ).toBe(204);
    expect(
      (
        await request(app)
          .get(`/profile/avatar/${a.id}`)
          .set('Cookie', b.cookie)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .delete('/profile/avatar')
          .set('Cookie', a.cookie)
          .set('Origin', env.WEB_ORIGIN)
          .send({})
      ).status,
    ).toBe(200);
    expect(
      (
        await source.query('SELECT avatar_bytes FROM users WHERE id = ?', [
          a.id,
        ])
      )[0].avatar_bytes,
    ).toBeNull();
  });
  it('persists independent concurrent toggles and preserves account data', async () => {
    const a = await account();
    const b = await account();
    const initial = {
      tasks: true,
      subjects: true,
      flashcards: true,
      ai: false,
    };
    expect(await prefs.read(a.id)).toEqual(initial);
    const before = await users.userById(a.id);
    await Promise.all([
      patch('/preferences', a.cookie, { tasks: false }),
      patch('/preferences', a.cookie, { ai: true }),
    ]);
    expect(await prefs.read(a.id)).toEqual({
      ...initial,
      tasks: false,
      ai: true,
    });
    expect(await prefs.read(b.id)).toEqual(initial);
    expect(
      (await patch('/preferences', a.cookie, { id: b.id, subjects: false }))
        .status,
    ).toBe(400);
    expect((await patch('/preferences', a.cookie, {})).status).toBe(400);
    await patch('/preferences', a.cookie, { tasks: true });
    expect(await users.userById(a.id)).toEqual(before);
    const newToken = await sessions.create(a.id);
    expect(
      (
        await request(app)
          .get('/profile/preferences')
          .set('Cookie', `edutrack_session=${newToken}`)
      ).body.ai,
    ).toBe(true);
    expect(
      (await request(app).get('/tasks').set('Cookie', a.cookie)).status,
    ).toBe(200);
  });
  it('guards reads/writes and AI before any data/provider work and fails closed', async () => {
    const a = await account();
    let accesses = 0;
    let providerCalls = 0;
    const testApp = express();
    const auth = new AuthService(
      users,
      sessions,
      new RateLimitRepository(source),
      delivery,
    );
    testApp.use(requireSession(auth, env));
    testApp.all('/manual', prefs.guard('tasks'), (_req, res) => {
      accesses++;
      res.json({ user: authenticatedSession(res).userId });
    });
    testApp.post('/ai', prefs.guard('tasks', true), (_req, res) => {
      providerCalls++;
      res.end();
    });
    testApp.use(errorHandler(logger));
    expect(
      (await request(testApp).post('/ai').set('Cookie', a.cookie)).body.error
        .code,
    ).toBe('AI_DISABLED');
    expect(providerCalls).toBe(0);
    expect(
      (await request(testApp).get('/manual').set('Cookie', a.cookie)).status,
    ).toBe(200);
    await prefs.update(a.id, { tasks: false, ai: true });
    for (const method of ['get', 'post', 'patch', 'delete'] as const)
      expect(
        (await request(testApp)[method]('/manual').set('Cookie', a.cookie)).body
          .error.code,
      ).toBe('MODULE_DISABLED');
    expect(
      (await request(testApp).post('/ai').set('Cookie', a.cookie)).body.error
        .code,
    ).toBe('MODULE_DISABLED');
    expect(accesses).toBe(1);
    expect(providerCalls).toBe(0);
    await prefs.update(a.id, { tasks: true });
    expect(
      (await request(testApp).post('/ai').set('Cookie', a.cookie)).status,
    ).toBe(200);
    expect(providerCalls).toBe(1);
    await source.query('DELETE FROM user_preferences WHERE user_id = ?', [
      a.id,
    ]);
    expect(
      (await request(testApp).get('/manual').set('Cookie', a.cookie)).body.error
        .code,
    ).toBe('PREFERENCES_MISSING');
    expect(accesses).toBe(1);
  });
});

describe('sensitive profile changes', () => {
  it('requires fresh proof tied to the initiating session and keeps old email active', async () => {
    const a = await account();
    const target = `${randomUUID()}@example.com`;
    expect(
      (await write('/email/request', a.cookie, { email: target })).status,
    ).toBe(401);
    expect(
      (
        await write('/identity/password', a.cookie, {
          currentPassword: 'wrong',
        })
      ).status,
    ).toBe(401);
    await write('/identity/password', a.cookie, { currentPassword: password });
    const other = await sessions.create(a.id);
    expect(
      (
        await write('/email/request', `edutrack_session=${other}`, {
          email: target,
        })
      ).status,
    ).toBe(401);
    await source.query(
      'UPDATE identity_proofs SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND)',
    );
    expect(
      (await write('/email/request', a.cookie, { email: target })).status,
    ).toBe(401);
    expect((await start(a.cookie, target)).status).toBe(202);
    expect((await users.userById(a.id))?.email).toBe(a.email);
    expect(await users.passwordByEmail(a.email)).not.toBeNull();
    expect(await users.passwordByEmail(target)).toBeNull();
    expect((await write('/email/resend', a.cookie)).status).toBe(429);
  });
  it('reserves canonical addresses across changes and registrations and releases expired reservations', async () => {
    const a = await account();
    const b = await account();
    const target = `${randomUUID()}@example.com`;
    expect((await start(a.cookie, `  ${target.toUpperCase()}  `)).status).toBe(
      202,
    );
    expect((await start(b.cookie, target)).status).toBe(409);
    await expect(
      users.createLocal(target, Buffer.alloc(64), Buffer.alloc(32)),
    ).rejects.toMatchObject({ code: 'EMAIL_UNAVAILABLE' });
    await source.query(
      'UPDATE email_change_reservations SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE user_id = ?',
      [a.id],
    );
    const created = await users.createLocal(
      target,
      Buffer.alloc(64),
      Buffer.alloc(32),
    );
    expect(created.email).toBe(target);
    expect((await start(b.cookie, target)).status).toBe(409);
    const raced = `${randomUUID()}@example.com`;
    await write('/identity/password', a.cookie, { currentPassword: password });
    await write('/identity/password', b.cookie, { currentPassword: password });
    await releaseRate();
    const outcomes = await Promise.all([
      write('/email/request', a.cookie, { email: raced }),
      write('/email/request', b.cookie, { email: raced }),
    ]);
    expect(outcomes.map((r) => r.status).sort()).toEqual([202, 409]);
  });
  it('invalidates old codes on resend, allows only 3 emissions and 5 guesses, and expires codes', async () => {
    const a = await account();
    const target = `${randomUUID()}@example.com`;
    await start(a.cookie, target);
    const old = await codeFor(target);
    await releaseRate();
    expect((await write('/email/resend', a.cookie)).status).toBe(202);
    const next = await codeFor(target);
    expect(next).not.toBe(old);
    expect(
      (await write('/email/confirm', a.cookie, { code: old })).status,
    ).toBe(400);
    await releaseRate();
    expect((await write('/email/resend', a.cookie)).status).toBe(202);
    const last = await codeFor(target);
    await releaseRate();
    expect((await write('/email/resend', a.cookie)).status).toBe(429);
    const wrong = last === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++)
      expect(
        (await write('/email/confirm', a.cookie, { code: wrong })).status,
      ).toBe(400);
    expect(
      (await write('/email/confirm', a.cookie, { code: last })).status,
    ).toBe(400);
    expect((await users.userById(a.id))?.email).toBe(a.email);
    const b = await account();
    const expiredTarget = `${randomUUID()}@example.com`;
    await start(b.cookie, expiredTarget);
    const expiredCode = await codeFor(expiredTarget);
    await source.query(
      "UPDATE email_challenges SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE user_id = ? AND purpose = 'change_email'",
      [b.id],
    );
    expect(
      (await write('/email/confirm', b.cookie, { code: expiredCode })).status,
    ).toBe(400);
  });
  it('confirms once, revokes sessions and recoveries, notifies old email and keeps Google sub', async () => {
    const a = await account();
    await users.linkGoogle(a.id, a.subject, a.email);
    const target = `${randomUUID()}@example.com`;
    await start(a.cookie, target);
    const code = await codeFor(target);
    const grant = await recoveryGrant(a.id, a.email);
    expect((await write('/email/confirm', a.cookie, { code })).status).toBe(
      204,
    );
    expect(
      (await request(app).get('/profile').set('Cookie', a.cookie)).status,
    ).toBe(401);
    expect(await sessions.resolve(a.token)).toBeNull();
    expect(await users.passwordByEmail(a.email)).toBeNull();
    expect(await users.passwordByEmail(target)).not.toBeNull();
    expect((await users.googleUser(a.subject))?.id).toBe(a.id);
    await expect(
      delivery.reset(grant, Buffer.alloc(64), Buffer.alloc(32)),
    ).rejects.toMatchObject({ code: 'INVALID_RESET_GRANT' });
    const notices: string[] = [];
    for (let i = 0; i < 30; i++)
      if (
        !(await delivery.deliverOne(async (email, _code, purpose) => {
          if (purpose === 'email_changed') notices.push(email);
        }))
      )
        break;
    expect(notices).toContain(a.email);
    const login = await request(app)
      .post('/auth/login')
      .set('Origin', env.WEB_ORIGIN)
      .send({ email: target, password });
    expect(login.status).toBe(200);
    expect(login.body.user.id).toBe(a.id);
    expect(
      await source.query(
        "SELECT id FROM email_challenges WHERE user_id = ? AND purpose = 'reset_password' AND active_marker = 1",
        [a.id],
      ),
    ).toHaveLength(0);
  });
  it('changes only existing local passwords, revokes grants/sessions and requires current password', async () => {
    const a = await account();
    const google = await account(true);
    const next = 'new-password-long-enough';
    expect(
      (
        await write('/password', a.cookie, {
          currentPassword: 'wrong',
          password: next,
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await write('/password', a.cookie, {
          currentPassword: password,
          password: 'short',
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await write('/password', google.cookie, {
          currentPassword: password,
          password: next,
        })
      ).body.error.code,
    ).toBe('NO_LOCAL_PASSWORD');
    expect(await users.passwordByEmail(google.email)).toBeNull();
    const grant = await recoveryGrant(a.id, a.email);
    expect(
      (
        await write('/password', a.cookie, {
          currentPassword: password,
          password: next,
        })
      ).status,
    ).toBe(204);
    expect(await sessions.resolve(a.token)).toBeNull();
    const login = (value: string) =>
      request(app)
        .post('/auth/login')
        .set('Origin', env.WEB_ORIGIN)
        .send({ email: a.email, password: value });
    expect((await login(password)).status).toBe(401);
    expect((await login(next)).status).toBe(200);
    expect(
      await source.query(
        'SELECT id FROM reset_grants WHERE user_id = ? AND consumed_at IS NULL',
        [a.id],
      ),
    ).toHaveLength(0);
    await expect(
      delivery.reset(grant, Buffer.alloc(64), Buffer.alloc(32)),
    ).rejects.toMatchObject({ code: 'INVALID_RESET_GRANT' });
  });
});
