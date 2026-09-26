import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { sessionCookieName } from '../src/modules/auth/auth.routes.js';

describe('email verification migration', () => {
  it('migrates existing local and Google-only accounts once', async () => {
    const env = loadEnv();
    const database = `${env.TEST_DB_NAME}_email_${randomBytes(4).toString('hex')}`;
    const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
    await admin.initialize();
    await admin.query(`CREATE DATABASE \`${database}\``);
    const options = createDataSource({ ...env, DB_NAME: database }).options;
    const original = new DataSource({
      ...options,
      migrations: [CreateAuthentication20260924221500],
    });
    const upgraded = new DataSource({
      ...options,
      migrations: [
        CreateAuthentication20260924221500,
        CreateEmailVerification20260924230000,
      ],
    });
    try {
      await original.initialize();
      await original.runMigrations();
      const users = new AuthRepository(original);
      const local = await users.createLocal(
        `${randomUUID()}@example.com`,
        Buffer.alloc(64),
        Buffer.alloc(32),
      );
      const google = { id: randomUUID(), email: `${randomUUID()}@example.com` };
      await original.query('INSERT INTO users (id, email) VALUES (?, ?)', [
        google.id,
        google.email,
      ]);
      await original.query(
        "INSERT INTO external_identities (id, user_id, provider, subject, provider_email) VALUES (?, ?, 'google', ?, ?)",
        [randomUUID(), google.id, randomUUID(), 'google@example.com'],
      );
      const oldSession = await new SessionRepository(original).create(local.id);
      await original.destroy();
      await upgraded.initialize();
      expect(upgraded.options.synchronize).toBe(false);
      expect(await upgraded.runMigrations()).toHaveLength(1);
      expect(await upgraded.runMigrations()).toHaveLength(0);
      const rows = await upgraded.query(
        'SELECT id, email_verified_at FROM users WHERE id IN (?, ?)',
        [local.id, google.id],
      );
      expect(
        rows.find((row: { id: string }) => row.id === local.id)
          ?.email_verified_at,
      ).toBeNull();
      expect(
        rows.find((row: { id: string }) => row.id === google.id)
          ?.email_verified_at,
      ).not.toBeNull();
      const app = createApp({
        logger: pino({ level: 'silent' }),
        webOrigin: env.WEB_ORIGIN,
        source: upgraded,
        env,
      });
      const pending = await request(app)
        .get('/auth/me')
        .set('Cookie', `${sessionCookieName(env)}=${oldSession}`);
      expect(pending.status).toBe(403);
      expect(pending.body.error.code).toBe('EMAIL_VERIFICATION_REQUIRED');
    } finally {
      if (original.isInitialized) await original.destroy();
      if (upgraded.isInitialized) await upgraded.destroy();
      await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
      await admin.destroy();
    }
  });
});
