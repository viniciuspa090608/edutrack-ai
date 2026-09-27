import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateStudyProgress20260928010000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE study_progress_tracking (
      user_id char(36) PRIMARY KEY, study_timezone varchar(100) NOT NULL DEFAULT 'UTC', tracking_started_at_utc datetime(3) NOT NULL,
      CONSTRAINT fk_tracking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE study_timezone_history (
      id bigint unsigned AUTO_INCREMENT PRIMARY KEY, user_id char(36) NOT NULL, timezone_id varchar(100) NOT NULL, effective_at_utc datetime(3) NOT NULL,
      KEY ix_timezone_owner_effective (user_id,effective_at_utc,id), CONSTRAINT fk_timezone_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE study_activity_source_revisions (
      user_id char(36) NOT NULL, source_type varchar(40) NOT NULL, source_id varchar(64) NOT NULL, completion_revision bigint unsigned NOT NULL,
      PRIMARY KEY (user_id,source_type,source_id), CONSTRAINT fk_activity_revision_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE study_achievement_grants (
      user_id char(36) NOT NULL, achievement_code varchar(40) NOT NULL, earned_at_utc datetime(3) NOT NULL, triggering_event_id char(36) NOT NULL,
      PRIMARY KEY (user_id,achievement_code), CONSTRAINT fk_grant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    // Existing analytics events remain intact and are not retroactively credited.
    await runner.query(
      'ALTER TABLE study_activity_events ADD timezone_id varchar(100) NULL, ADD local_date date NULL, ADD KEY ix_activity_owner_date (user_id,local_date), ADD KEY ix_activity_owner_kind (user_id,kind,occurred_at)',
    );
    await runner.query(
      'INSERT INTO study_progress_tracking (user_id,tracking_started_at_utc) SELECT id,UTC_TIMESTAMP(3) FROM users',
    );
    await runner.query(
      "INSERT INTO study_timezone_history (user_id,timezone_id,effective_at_utc) SELECT user_id,'UTC',tracking_started_at_utc FROM study_progress_tracking",
    );
    // Initialization is metadata only, so account creation remains compatible with earlier schemas.
    await runner.query(`CREATE TRIGGER initialize_study_progress AFTER INSERT ON users FOR EACH ROW BEGIN
      INSERT INTO study_progress_tracking (user_id,tracking_started_at_utc) VALUES (NEW.id,NEW.created_at);
      INSERT INTO study_timezone_history (user_id,timezone_id,effective_at_utc) VALUES (NEW.id,'UTC',NEW.created_at);
    END`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TRIGGER initialize_study_progress');
    await runner.query(
      'ALTER TABLE study_activity_events DROP INDEX ix_activity_owner_date, DROP INDEX ix_activity_owner_kind, DROP COLUMN timezone_id, DROP COLUMN local_date',
    );
    await runner.query('DROP TABLE study_achievement_grants');
    await runner.query('DROP TABLE study_activity_source_revisions');
    await runner.query('DROP TABLE study_timezone_history');
    await runner.query('DROP TABLE study_progress_tracking');
  }
}
