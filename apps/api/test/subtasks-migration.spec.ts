import { randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { CreateEmailVerification20260924230000 } from '../src/database/migrations/20260924230000-CreateEmailVerification.js';
import { CreateProfilePreferences20260926160000 } from '../src/database/migrations/20260926160000-CreateProfilePreferences.js';
import { CreateStudyTasks20260926180000 } from '../src/database/migrations/20260926180000-CreateStudyTasks.js';
import { CreateTaskSubtasks20260926190000 } from '../src/database/migrations/20260926190000-CreateTaskSubtasks.js';
it('applies/reverses subtasks once, has no stored percentage/counters and cascades on task deletion', async () => {
  const env = loadEnv();
  const database = `${env.TEST_DB_NAME}_submig_${randomBytes(4).toString('hex')}`;
  const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
  const source = new DataSource({
    ...createDataSource({ ...env, DB_NAME: database }).options,
    migrations: [
      CreateAuthentication20260924221500,
      CreateEmailVerification20260924230000,
      CreateProfilePreferences20260926160000,
      CreateStudyTasks20260926180000,
      CreateTaskSubtasks20260926190000,
    ],
  });
  const original = new DataSource({
    ...source.options,
    migrations: [
      CreateAuthentication20260924221500,
      CreateEmailVerification20260924230000,
      CreateProfilePreferences20260926160000,
      CreateStudyTasks20260926180000,
    ],
  });
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  try {
    await original.initialize();
    await original.runMigrations();
    const userId = randomUUID();
    const taskId = randomUUID();
    await original.query('INSERT INTO users (id,email) VALUES (?,?)', [
      userId,
      `${userId}@example.com`,
    ]);
    await original.query(
      "INSERT INTO study_tasks (id,user_id,title,status) VALUES (?,?,'Original','COMPLETED')",
      [taskId, userId],
    );
    await original.destroy();
    await source.initialize();
    expect(source.options.synchronize).toBe(false);
    expect(await source.runMigrations()).toHaveLength(1);
    expect(await source.runMigrations()).toHaveLength(0);
    expect(
      (
        await source.query('SELECT status FROM study_tasks WHERE id = ?', [
          taskId,
        ])
      )[0].status,
    ).toBe('COMPLETED');
    const columns = await source.query<Array<{ Field: string }>>(
      'SHOW COLUMNS FROM task_subtasks',
    );
    expect(columns.map((item) => item.Field)).toEqual([
      'id',
      'task_id',
      'title',
      'is_completed',
      'position',
      'created_at',
      'updated_at',
    ]);
    await expect(
      source.query(
        "INSERT INTO task_subtasks (id,task_id,title,position) VALUES (?,?,'Órfã',0)",
        [randomUUID(), randomUUID()],
      ),
    ).rejects.toThrow();
    await source.query(
      "INSERT INTO task_subtasks (id,task_id,title,position) VALUES (?,?,'Passo',0)",
      [randomUUID(), taskId],
    );
    await source.query('DELETE FROM study_tasks WHERE id = ? AND user_id = ?', [
      taskId,
      userId,
    ]);
    expect(await source.query('SELECT * FROM task_subtasks')).toHaveLength(0);
    await source.undoLastMigration();
    expect(await source.query("SHOW TABLES LIKE 'task_subtasks'")).toHaveLength(
      0,
    );
    expect(await source.runMigrations()).toHaveLength(1);
  } finally {
    if (original.isInitialized) await original.destroy();
    if (source.isInitialized) await source.destroy();
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.destroy();
  }
});
