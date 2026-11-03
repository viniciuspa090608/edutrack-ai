import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClassroomIntegration20261102020000 implements MigrationInterface {
  name = 'CreateClassroomIntegration20261102020000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE user_preferences ADD onboarding_step varchar(16) NOT NULL DEFAULT 'completed'`,
    );
    // Existing accounts stay completed; newly inserted preference rows start at modules.
    await q.query(
      `ALTER TABLE user_preferences ALTER COLUMN onboarding_step SET DEFAULT 'modules'`,
    );
    await q.query(`CREATE TABLE classroom_connections (
      user_id char(36) NOT NULL PRIMARY KEY, google_subject varchar(255) CHARACTER SET ascii COLLATE ascii_bin NULL,
      email varchar(320) NULL, state varchar(24) NOT NULL DEFAULT 'disconnected',
      version int unsigned NOT NULL DEFAULT 0, scopes json NOT NULL,
      encrypted_tokens text NULL, updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE classroom_oauth_attempts (
      id char(36) NOT NULL PRIMARY KEY, user_id char(36) NOT NULL, session_id char(36) NOT NULL,
      state_hash binary(32) NOT NULL UNIQUE, browser_hash binary(32) NOT NULL,
      verifier varchar(128) NOT NULL, nonce varchar(128) NOT NULL, purpose varchar(16) NOT NULL,
      connection_version int unsigned NOT NULL, expires_at datetime(3) NOT NULL, consumed_at datetime(3) NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE classroom_selections (
      user_id char(36) NOT NULL, google_subject varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
      course_id varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, selection json NOT NULL,
      PRIMARY KEY(user_id,google_subject,course_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE classroom_operations (
      id char(36) NOT NULL PRIMARY KEY, user_id char(36) NOT NULL, request_id char(36) NOT NULL,
      connection_version int unsigned NOT NULL, google_subject varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
      kind varchar(16) NOT NULL, state varchar(16) NOT NULL DEFAULT 'queued', phase varchar(16) NOT NULL DEFAULT 'queued',
      active_marker tinyint NULL DEFAULT 1, selection json NOT NULL, checkpoint json NULL,
      processed int unsigned NOT NULL DEFAULT 0, total int unsigned NULL, message varchar(1000) NULL,
      lease_owner char(36) NULL, lease_until datetime(3) NULL, attempts int unsigned NOT NULL DEFAULT 0,
      available_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_classroom_request(user_id,request_id), UNIQUE KEY uq_classroom_active(user_id,active_marker),
      KEY ix_classroom_queue(state,available_at,lease_until), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE classroom_operation_items (
      id char(36) NOT NULL PRIMARY KEY, operation_id char(36) NOT NULL, user_id char(36) NOT NULL,
      item_key binary(32) NOT NULL, entity varchar(16) NOT NULL, external_id varchar(255) NOT NULL,
      course_id varchar(255) NOT NULL, title varchar(1000) NOT NULL, outcome varchar(16) NOT NULL,
      reason varchar(1000) NULL, local_id char(36) NULL, conflict_id char(36) NULL,
      UNIQUE KEY uq_classroom_item(operation_id,item_key),
      FOREIGN KEY(operation_id) REFERENCES classroom_operations(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    for (const [module, target] of [
      ['task', 'study_tasks'],
      ['subject', 'study_subjects'],
    ] as const) {
      await q.query(`CREATE TABLE ${module}_classroom_sources (
        id char(36) NOT NULL PRIMARY KEY, user_id char(36) NOT NULL,
        google_subject varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        course_id varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, item_id varchar(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
        local_id char(36) NULL, deleted boolean NOT NULL DEFAULT false,
        snapshot json NOT NULL, provenance json NOT NULL, conflict json NULL, revision int unsigned NOT NULL DEFAULT 1,
        UNIQUE KEY uq_${module}_classroom_origin(user_id,google_subject,course_id,item_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(local_id) REFERENCES ${target}(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`);
      await q.query(`CREATE TABLE ${module}_classroom_receipts (
        user_id char(36) NOT NULL, receipt_id char(36) NOT NULL, result json NOT NULL,
        PRIMARY KEY(user_id,receipt_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`);
    }
  }
  async down(q: QueryRunner): Promise<void> {
    for (const table of [
      'subject_classroom_receipts',
      'subject_classroom_sources',
      'task_classroom_receipts',
      'task_classroom_sources',
      'classroom_operation_items',
      'classroom_operations',
      'classroom_selections',
      'classroom_oauth_attempts',
      'classroom_connections',
    ])
      await q.query(`DROP TABLE ${table}`);
    await q.query('ALTER TABLE user_preferences DROP onboarding_step');
  }
}
