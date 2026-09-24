import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';

describe('authentication migration', () => {
  it('applies once and reverses cleanly in isolated MySQL', async () => {
    const env = loadEnv();
    const database = `${env.TEST_DB_NAME}_auth_${randomBytes(4).toString('hex')}`;
    const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
    await admin.initialize();
    await admin.query(`CREATE DATABASE \`${database}\``);
    const source = new DataSource({
      ...createDataSource({ ...env, DB_NAME: database }).options,
      migrations: [CreateAuthentication20260924221500],
    });
    try {
      await source.initialize();
      expect(source.options.synchronize).toBe(false);
      expect(await source.runMigrations()).toHaveLength(1);
      expect(await source.runMigrations()).toHaveLength(0);
      expect(await source.query("SHOW TABLES LIKE 'users'")).toHaveLength(1);
      await source.undoLastMigration();
      expect(await source.query("SHOW TABLES LIKE 'users'")).toHaveLength(0);
    } finally {
      if (source.isInitialized) await source.destroy();
      await admin.query(`DROP DATABASE \`${database}\``);
      await admin.destroy();
    }
  });
});
