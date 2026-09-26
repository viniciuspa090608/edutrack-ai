import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePomodoroSessions20260926200000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE pomodoro_sessions (
      id char(36) PRIMARY KEY, user_id char(36) NOT NULL, task_id char(36) NULL,
      state enum('RUNNING','PAUSED','BETWEEN_BLOCKS','COMPLETED','CANCELED') NOT NULL,
      active_ms bigint unsigned NOT NULL DEFAULT 0, completed_blocks int unsigned NOT NULL DEFAULT 0,
      running_since datetime(3) NULL, started_at datetime(3) NOT NULL, ended_at datetime(3) NULL,
      version int unsigned NOT NULL DEFAULT 0,
      KEY ix_pomodoro_owner_started (user_id, started_at, id),
      CONSTRAINT fk_pomodoro_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_pomodoro_task FOREIGN KEY (task_id) REFERENCES study_tasks(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE pomodoro_open_sessions (
      user_id char(36) PRIMARY KEY, session_id char(36) NOT NULL UNIQUE,
      CONSTRAINT fk_pomodoro_open_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_pomodoro_open_session FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE pomodoro_open_sessions');
    await runner.query('DROP TABLE pomodoro_sessions');
  }
}
