import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthentication20260924221500 implements MigrationInterface {
  name = 'CreateAuthentication20260924221500';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE users (
      id char(36) NOT NULL PRIMARY KEY,
      email varchar(320) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE password_credentials (
      user_id char(36) NOT NULL PRIMARY KEY,
      password_hash varbinary(64) NOT NULL,
      salt varbinary(32) NOT NULL,
      hash_version smallint unsigned NOT NULL,
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_password_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE external_identities (
      id char(36) NOT NULL PRIMARY KEY,
      user_id char(36) NOT NULL,
      provider varchar(32) NOT NULL,
      subject varchar(255) NOT NULL,
      provider_email varchar(320) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY uq_identity_subject (provider, subject),
      UNIQUE KEY uq_identity_user_provider (user_id, provider),
      CONSTRAINT fk_identity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE sessions (
      id char(36) NOT NULL PRIMARY KEY,
      user_id char(36) NOT NULL,
      token_hash binary(32) NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      last_used_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      expires_at datetime(3) NOT NULL,
      revoked_at datetime(3) NULL,
      UNIQUE KEY uq_session_token (token_hash),
      KEY ix_session_expiry (expires_at),
      KEY ix_session_user (user_id),
      CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE oauth_attempts (
      id char(36) NOT NULL PRIMARY KEY,
      state_hash binary(32) NOT NULL,
      browser_hash binary(32) NOT NULL,
      code_verifier varchar(128) NOT NULL,
      nonce varchar(128) NOT NULL,
      intent varchar(8) NOT NULL,
      user_id char(36) NULL,
      session_id char(36) NULL,
      return_to varchar(255) NOT NULL,
      expires_at datetime(3) NOT NULL,
      consumed_at datetime(3) NULL,
      UNIQUE KEY uq_oauth_state (state_hash),
      KEY ix_oauth_expiry (expires_at),
      CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_oauth_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await queryRunner.query(`CREATE TABLE auth_rate_limits (
      rate_key binary(32) NOT NULL PRIMARY KEY,
      attempts int unsigned NOT NULL,
      window_end datetime(3) NOT NULL,
      KEY ix_rate_window (window_end)
    ) ENGINE=InnoDB`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of [
      'auth_rate_limits',
      'oauth_attempts',
      'sessions',
      'external_identities',
      'password_credentials',
      'users',
    ]) {
      await queryRunner.query(`DROP TABLE ${table}`);
    }
  }
}
