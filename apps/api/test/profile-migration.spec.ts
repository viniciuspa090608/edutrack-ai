import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import { CreateProfilePreferences20260926160000 } from '../src/database/migrations/20260926160000-CreateProfilePreferences.js';

it('backfills profiles/preferences once on real MySQL and can roll back/reapply', async () => {
  const env = loadEnv();
  const database = `${env.TEST_DB_NAME}_profilemig_${randomBytes(4).toString('hex')}`;
  const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
  const upgraded = new DataSource({
    ...createDataSource({ ...env, DB_NAME: database }).options,
    migrations: [
      CreateAuthentication20260924221500,
      CreateEmailVerification20260924230000,
      CreateProfilePreferences20260926160000,
    ],
  });
  const original = new DataSource({
    ...upgraded.options,
    migrations: [
      CreateAuthentication20260924221500,
      CreateEmailVerification20260924230000,
    ],
  });
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  try {
    await original.initialize();
    await original.runMigrations();
    const id = randomUUID();
    await original.query('INSERT INTO users (id, email) VALUES (?, ?)', [
      id,
      `${id}@example.com`,
    ]);
    await original.destroy();
    await upgraded.initialize();
    expect(upgraded.options.synchronize).toBe(false);
    expect(await upgraded.runMigrations()).toHaveLength(1);
    expect(await upgraded.runMigrations()).toHaveLength(0);
    const rows = await upgraded.query(
      'SELECT u.display_name, u.avatar_bytes, p.tasks_enabled, p.subjects_enabled, p.flashcards_enabled, p.ai_enabled FROM users u JOIN user_preferences p ON p.user_id = u.id WHERE u.id = ?',
      [id],
    );
    expect(rows[0]).toMatchObject({
      display_name: 'Estudante',
      avatar_bytes: null,
      tasks_enabled: 1,
      subjects_enabled: 1,
      flashcards_enabled: 1,
      ai_enabled: 0,
    });
    await upgraded.undoLastMigration();
    expect(await upgraded.runMigrations()).toHaveLength(1);
  } finally {
    if (original.isInitialized) await original.destroy();
    if (upgraded.isInitialized) await upgraded.destroy();
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.destroy();
  }
});
