import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailVerification20260924230000 implements MigrationInterface {
  name = 'CreateEmailVerification20260924230000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE users ADD email_verified_at datetime(3) NULL',
    );
    await queryRunner.query(`UPDATE users u
      JOIN external_identities i ON i.user_id = u.id AND i.provider = 'google'
      LEFT JOIN password_credentials p ON p.user_id = u.id
      SET u.email_verified_at = u.created_at WHERE p.user_id IS NULL`);
    await queryRunner.query(`CREATE TABLE email_challenges (
      id char(36) NOT NULL PRIMARY KEY,
      user_id char(36) NOT NULL,
      purpose varchar(24) NOT NULL,
      code_hmac binary(32) NOT NULL,
      state varchar(16) NOT NULL,
      active_marker tinyint unsigned NULL,
      attempts tinyint unsigned NOT NULL DEFAULT 0,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      delivered_at datetime(3) NULL,
      expires_at datetime(3) NULL,
      consumed_at datetime(3) NULL,
      UNIQUE KEY uq_challenge_active (user_id, purpose, active_marker),
      KEY ix_challenge_expiry (expires_at),
      CONSTRAINT fk_challenge_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE email_outbox (
      id char(36) NOT NULL PRIMARY KEY,
      challenge_id char(36) NOT NULL,
      ciphertext blob NULL,
      nonce binary(12) NULL,
      auth_tag binary(16) NULL,
      state varchar(16) NOT NULL,
      attempts tinyint unsigned NOT NULL DEFAULT 0,
      available_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      lease_until datetime(3) NULL,
      lease_token char(36) NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      delivered_at datetime(3) NULL,
      UNIQUE KEY uq_outbox_challenge (challenge_id),
      KEY ix_outbox_pickup (state, available_at),
      CONSTRAINT fk_outbox_challenge FOREIGN KEY (challenge_id) REFERENCES email_challenges(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE email_rate_limits (
      rate_key binary(32) NOT NULL PRIMARY KEY,
      attempts smallint unsigned NOT NULL,
      window_end datetime(3) NOT NULL,
      last_issued_at datetime(3) NOT NULL,
      KEY ix_email_rate_expiry (window_end)
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE verification_contexts (
      id char(36) NOT NULL PRIMARY KEY,
      user_id char(36) NOT NULL,
      token_hash binary(32) NOT NULL,
      expires_at datetime(3) NOT NULL,
      consumed_at datetime(3) NULL,
      UNIQUE KEY uq_verification_token (token_hash),
      KEY ix_verification_expiry (expires_at),
      CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE reset_grants (
      id char(36) NOT NULL PRIMARY KEY,
      user_id char(36) NOT NULL,
      token_hash binary(32) NOT NULL,
      expires_at datetime(3) NOT NULL,
      consumed_at datetime(3) NULL,
      UNIQUE KEY uq_reset_token (token_hash),
      KEY ix_reset_expiry (expires_at),
      CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'reset_grants',
      'verification_contexts',
      'email_rate_limits',
      'email_outbox',
      'email_challenges',
    ]) {
      await queryRunner.query(`DROP TABLE ${table}`);
    }
    await queryRunner.query('ALTER TABLE users DROP COLUMN email_verified_at');
  }
}
