import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfilePreferences20260926160000 implements MigrationInterface {
  name = 'CreateProfilePreferences20260926160000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE users ADD display_name varchar(240) NOT NULL DEFAULT 'Estudante',
      ADD avatar_bytes mediumblob NULL, ADD avatar_mime varchar(32) NULL,
      ADD avatar_updated_at datetime(3) NULL`);
    await q.query(`CREATE TABLE user_preferences (
      user_id char(36) PRIMARY KEY, tasks_enabled boolean NOT NULL DEFAULT TRUE,
      subjects_enabled boolean NOT NULL DEFAULT TRUE, flashcards_enabled boolean NOT NULL DEFAULT TRUE,
      ai_enabled boolean NOT NULL DEFAULT FALSE,
      CONSTRAINT fk_preferences_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(
      'INSERT INTO user_preferences (user_id) SELECT id FROM users',
    );
    // A shared address lock serializes registration and email changes, including absent addresses.
    await q.query(`CREATE TABLE email_address_locks (
      email varchar(320) COLLATE utf8mb4_bin PRIMARY KEY
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE email_change_reservations (
      user_id char(36) PRIMARY KEY, email varchar(320) COLLATE utf8mb4_bin NOT NULL UNIQUE,
      expires_at datetime(3) NOT NULL,
      CONSTRAINT fk_email_change_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE identity_proofs (
      session_id char(36) PRIMARY KEY, expires_at datetime(3) NOT NULL,
      CONSTRAINT fk_proof_session FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(
      'ALTER TABLE oauth_attempts MODIFY intent varchar(16) NOT NULL',
    );
  }
  async down(q: QueryRunner): Promise<void> {
    for (const table of [
      'identity_proofs',
      'email_change_reservations',
      'email_address_locks',
      'user_preferences',
    ])
      await q.query(`DROP TABLE ${table}`);
    await q.query(
      'ALTER TABLE oauth_attempts MODIFY intent varchar(8) NOT NULL',
    );
    await q.query(
      'ALTER TABLE users DROP display_name, DROP avatar_bytes, DROP avatar_mime, DROP avatar_updated_at',
    );
  }
}
