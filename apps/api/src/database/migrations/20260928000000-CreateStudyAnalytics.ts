import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateStudyAnalytics20260928000000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE study_activity_events (
      id char(36) PRIMARY KEY, user_id char(36) NOT NULL, kind varchar(40) NOT NULL,
      source_type varchar(40) NOT NULL, source_id varchar(64) NOT NULL, source_transition_id varchar(64) NOT NULL,
      occurred_at datetime(3) NOT NULL,
      UNIQUE KEY uq_activity_origin (user_id,source_type,source_id,source_transition_id,kind),
      KEY ix_activity_owner_time (user_id,occurred_at),
      CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE pomodoro_active_intervals (
      id char(36) PRIMARY KEY, user_id char(36) NOT NULL, session_id char(36) NOT NULL,
      started_at datetime(3) NOT NULL, ended_at datetime(3) NOT NULL, source_version int unsigned NOT NULL,
      UNIQUE KEY uq_pomodoro_interval (session_id,source_version), KEY ix_interval_owner_time (user_id,started_at,ended_at),
      CONSTRAINT fk_interval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_interval_session FOREIGN KEY (session_id) REFERENCES pomodoro_sessions(id) ON DELETE CASCADE,
      CONSTRAINT ck_interval_positive CHECK (ended_at > started_at)
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE study_analytics_coverage (
      metric varchar(40) PRIMARY KEY, started_at datetime(3) NOT NULL
    ) ENGINE=InnoDB`);
    // Older status and updated_at values cannot establish a historical transition.
    await runner.query(`INSERT INTO study_analytics_coverage (metric,started_at) VALUES
      ('activeMs',UTC_TIMESTAMP(3)),('pomodoroSessions',UTC_TIMESTAMP(3)),('tasks',UTC_TIMESTAMP(3)),
      ('reviews',UTC_TIMESTAMP(3)),('planItems',UTC_TIMESTAMP(3)),('roadmapBlocks',UTC_TIMESTAMP(3))`);
    await runner.query(`INSERT INTO study_activity_events (id,user_id,kind,source_type,source_id,source_transition_id,occurred_at)
      SELECT UUID(),user_id,'FLASHCARD_REVIEWED','flashcard',card_id,id,reviewed_at FROM flashcard_review_events`);
    await runner.query(`INSERT INTO study_activity_events (id,user_id,kind,source_type,source_id,source_transition_id,occurred_at)
      SELECT UUID(),user_id,'POMODORO_SESSION_COMPLETED','pomodoro',id,'terminal',ended_at FROM pomodoro_sessions WHERE state='COMPLETED' AND ended_at IS NOT NULL`);
    // Backfilled samples are retained, but cannot prove complete coverage before installation.
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE study_analytics_coverage');
    await runner.query('DROP TABLE pomodoro_active_intervals');
    await runner.query('DROP TABLE study_activity_events');
  }
}
