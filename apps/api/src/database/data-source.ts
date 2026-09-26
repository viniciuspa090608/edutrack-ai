import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import type { ApiEnv } from '../config/env.js';
import { taskEntity } from '../modules/tasks/task.entity.js';
import { subtaskEntity } from '../modules/tasks/subtask.entity.js';

export function createDataSource(env: ApiEnv): DataSource {
  return new DataSource({
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities: [taskEntity, subtaskEntity],
    timezone: 'Z',
    dateStrings: ['DATE'],
    migrations: [
      fileURLToPath(new URL('./migrations/*.{js,ts}', import.meta.url)),
    ],
    synchronize: false,
    migrationsRun: false,
    logging: false,
  });
}
