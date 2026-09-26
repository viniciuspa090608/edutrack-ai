import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import { CreateProfilePreferences20260926160000 } from '../src/database/migrations/20260926160000-CreateProfilePreferences.js';

it('applies study tasks once, preserves DATE/defaults/FK/indexes and rolls back on isolated MySQL', async () => {
  const env = loadEnv();
  const database = `${env.TEST_DB_NAME}_tasksmig_${randomBytes(4).toString('hex')}`;
  const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
  const source = createDataSource({ ...env, DB_NAME: database });
  const original = new DataSource({
    ...source.options,
    migrations: [
      CreateAuthentication20260924221500,
      CreateEmailVerification20260924230000,
      CreateProfilePreferences20260926160000,
    ],
  });
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  try {
    await original.initialize();
    await original.runMigrations();
    await original.destroy();
    await source.initialize();
    expect(source.options.synchronize).toBe(false);
    expect(await source.runMigrations()).toHaveLength(1);
    expect(await source.runMigrations()).toHaveLength(0);
    const userId = randomUUID();
    const id = randomUUID();
    await source.query('INSERT INTO users (id, email) VALUES (?, ?)', [
      userId,
      `${userId}@example.com`,
    ]);
    await source.query(
      'INSERT INTO study_tasks (id, user_id, title, due_date) VALUES (?, ?, ?, ?)',
      [id, userId, 'Data', '2024-02-29'],
    );
    const rows = await source.query(
      "SELECT priority, status, DATE_FORMAT(due_date, '%Y-%m-%d') AS dueDate FROM study_tasks WHERE id = ?",
      [id],
    );
    expect(rows[0]).toEqual({
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '2024-02-29',
    });
    await expect(
      source.query(
        'INSERT INTO study_tasks (id, user_id, title) VALUES (?, ?, ?)',
        [randomUUID(), randomUUID(), 'Órfã'],
      ),
    ).rejects.toThrow();
    const indexes = await source.query<Array<{ Key_name: string }>>(
      'SHOW INDEX FROM study_tasks',
    );
    expect(indexes.map((index) => index.Key_name)).toContain(
      'ix_tasks_owner_due',
    );
    expect(indexes.map((index) => index.Key_name)).toContain(
      'ix_tasks_owner_created',
    );
    await source.undoLastMigration();
    expect(await source.query("SHOW TABLES LIKE 'study_tasks'")).toHaveLength(
      0,
    );
    expect(
      await source.query('SELECT id FROM users WHERE id = ?', [userId]),
    ).toHaveLength(1);
    expect(await source.runMigrations()).toHaveLength(1);
  } finally {
    if (original.isInitialized) await original.destroy();
    if (source.isInitialized) await source.destroy();
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.destroy();
  }
});
