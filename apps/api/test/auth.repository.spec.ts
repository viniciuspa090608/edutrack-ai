import { CreateProfilePreferences20260926160000 } from '../src/database/migrations/20260926160000-CreateProfilePreferences.js';
import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import {
  AuthRepository,
  isDuplicateKey,
} from '../src/modules/auth/auth.repository.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_repo_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = new DataSource({
  ...createDataSource({ ...env, DB_NAME: database }).options,
  migrations: [
    CreateAuthentication20260924221500,
    CreateEmailVerification20260924230000,
    CreateProfilePreferences20260926160000,
  ],
});
const repository = new AuthRepository(source);

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

describe('auth persistence on MySQL', () => {
  it('does not create duplicate local accounts under concurrent registration', async () => {
    const email = `${randomUUID()}@example.com`;
    const attempts = await Promise.allSettled([
      repository.createLocal(email, Buffer.alloc(64), Buffer.alloc(32)),
      repository.createLocal(email, Buffer.alloc(64), Buffer.alloc(32)),
    ]);
    expect(attempts.filter((item) => item.status === 'fulfilled')).toHaveLength(
      1,
    );
    const denied = attempts.find((item) => item.status === 'rejected');
    expect(denied?.status === 'rejected' && denied.reason.code).toBe(
      'EMAIL_UNAVAILABLE',
    );
    expect(
      await source.query('SELECT id FROM users WHERE email = ?', [email]),
    ).toHaveLength(1);
    expect(await repository.passwordByEmail(email)).not.toBeNull();
  });

  it('keeps Google subject unique and does not merge two users', async () => {
    const [a, b] = await Promise.all([
      repository.createLocal(
        `${randomUUID()}@example.com`,
        Buffer.alloc(64),
        Buffer.alloc(32),
      ),
      repository.createLocal(
        `${randomUUID()}@example.com`,
        Buffer.alloc(64),
        Buffer.alloc(32),
      ),
    ]);
    const subject = randomUUID();
    const attempts = await Promise.allSettled([
      repository.linkGoogle(a.id, subject, a.email),
      repository.linkGoogle(b.id, subject, b.email),
    ]);
    expect(attempts.filter((item) => item.status === 'fulfilled')).toHaveLength(
      1,
    );
    expect([a.id, b.id]).toContain((await repository.googleUser(subject))?.id);
    expect(
      await source.query(
        "SELECT id FROM external_identities WHERE provider = 'google' AND subject = ?",
        [subject],
      ),
    ).toHaveLength(1);
    expect(
      await source.query('SELECT id FROM users WHERE id IN (?, ?)', [
        a.id,
        b.id,
      ]),
    ).toHaveLength(2);
  });

  it('creates only one account for concurrent first Google access', async () => {
    const email = `${randomUUID()}@example.com`;
    const subject = randomUUID();
    const attempts = await Promise.allSettled([
      repository.createGoogle(email, subject, email),
      repository.createGoogle(email, subject, email),
    ]);
    expect(attempts.filter((item) => item.status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(
      await source.query('SELECT id FROM users WHERE email = ?', [email]),
    ).toHaveLength(1);
    expect(
      await source.query(
        'SELECT id FROM external_identities WHERE subject = ?',
        [subject],
      ),
    ).toHaveLength(1);
  });
});
