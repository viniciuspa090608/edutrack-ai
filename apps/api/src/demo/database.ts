import type { ApiEnv } from '../config/env.js';
import type { DataSource, EntityManager, QueryRunner } from 'typeorm';

// Explicit inventory, including SQL-only modules. The migrations table is never reset.
export const demoTables = [
  'auth_rate_limits',
  'email_address_locks',
  'email_challenges',
  'email_change_reservations',
  'email_outbox',
  'email_rate_limits',
  'external_identities',
  'flashcard_ai_confirmations',
  'flashcard_decks',
  'flashcard_import_attempts',
  'flashcard_review_events',
  'flashcard_review_states',
  'flashcards',
  'identity_proofs',
  'oauth_attempts',
  'password_credentials',
  'pomodoro_active_intervals',
  'pomodoro_open_sessions',
  'pomodoro_sessions',
  'reset_grants',
  'sessions',
  'study_achievement_grants',
  'study_activity_events',
  'study_activity_source_revisions',
  'study_analytics_coverage',
  'study_progress_tracking',
  'study_routine_slots',
  'study_routines',
  'study_subjects',
  'study_tasks',
  'study_timezone_history',
  'subject_known_topics',
  'subject_plan_items',
  'subject_roadmap_blocks',
  'subject_roadmap_revisions',
  'subject_roadmap_steps',
  'subject_roadmaps',
  'task_subtasks',
  'user_preferences',
  'users',
  'verification_contexts',
] as const;

export function demoTarget(env: ApiEnv): string {
  return `${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
}

export function requireDemoEnvironment(env: ApiEnv): void {
  if (env.NODE_ENV !== 'development')
    throw new Error('Demo exige NODE_ENV=development.');
  if (!['localhost', '127.0.0.1', '::1'].includes(env.DB_HOST))
    throw new Error('Demo exige MySQL no computador local.');
  if (
    env.DB_NAME === env.TEST_DB_NAME ||
    ['mysql', 'sys', 'information_schema', 'performance_schema'].includes(
      env.DB_NAME.toLowerCase(),
    )
  )
    throw new Error('Banco protegido: operação de demo recusada.');
}

export function requireConfirmation(env: ApiEnv, confirmation?: string): void {
  requireDemoEnvironment(env);
  if (confirmation !== demoTarget(env))
    throw new Error(
      `Confirme o alvo com --confirm=${demoTarget(env)}. Nenhum dado foi alterado.`,
    );
}

export async function inspectDemo(source: DataSource) {
  const tables = await source.query<Array<{ name: string }>>(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME',
  );
  const database = await source.query<Array<{ name: string }>>(
    'SELECT DATABASE() AS name',
  );
  return {
    database: database[0]!.name,
    tables: tables.map((table) => table.name),
    pendingMigrations: await source.showMigrations(),
  };
}

export async function requireDemoSchema(source: DataSource): Promise<void> {
  const info = await inspectDemo(source);
  const expected = new Set<string>([...demoTables, 'migrations']);
  if (info.pendingMigrations)
    throw new Error('Aplique migrations antes de reset/população.');
  if (
    info.tables.length !== expected.size ||
    info.tables.some((table) => !expected.has(table))
  )
    throw new Error(
      'Inventário de tabelas divergente; reset/população recusados.',
    );
}

export async function requireEmptyDemo(manager: EntityManager): Promise<void> {
  for (const table of demoTables) {
    // Migrations bootstrap these coverage rows. They are metadata, not user data.
    if (table === 'study_analytics_coverage') continue;
    const rows = await manager.query<Array<{ present: number }>>(
      `SELECT 1 AS present FROM \`${table}\` LIMIT 1`,
    );
    if (rows.length)
      throw new Error(
        'Banco contém dados. Execute demo:reset explicitamente antes de demo:seed.',
      );
  }
}

export async function truncateDemo(runner: QueryRunner): Promise<void> {
  const rows = await runner.manager.query<Array<{ enabled: number }>>(
    'SELECT @@SESSION.FOREIGN_KEY_CHECKS AS enabled',
  );
  const previous = Number(rows[0]!.enabled);
  let stage = 'preparação';
  try {
    await runner.query('SET SESSION FOREIGN_KEY_CHECKS=0');
    for (const table of demoTables) {
      stage = table;
      await runner.query(`TRUNCATE TABLE \`${table}\``);
    }
  } catch {
    throw new Error(
      `Reset falhou na etapa ${stage}; limpeza pode ser parcial e TRUNCATE não admite rollback.`,
    );
  } finally {
    await runner.query(
      `SET SESSION FOREIGN_KEY_CHECKS=${previous === 0 ? 0 : 1}`,
    );
  }
}

export async function withDemoLock<T>(
  source: DataSource,
  operation: (runner: QueryRunner) => Promise<T>,
): Promise<T> {
  const runner = source.createQueryRunner();
  await runner.connect();
  try {
    const lock = await runner.manager.query<Array<{ acquired: number }>>(
      "SELECT GET_LOCK(CONCAT(DATABASE(), ':demo'),0) AS acquired",
    );
    if (Number(lock[0]!.acquired) !== 1)
      throw new Error('Outra operação de demo está em execução.');
    try {
      return await operation(runner);
    } finally {
      await runner.query("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':demo'))");
    }
  } finally {
    await runner.release();
  }
}
