import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccountAISettings20261102010000 implements MigrationInterface {
  name = 'CreateAccountAISettings20261102010000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE user_ai_settings (
      user_id char(36) NOT NULL PRIMARY KEY,
      mode varchar(10) NOT NULL DEFAULT 'platform',
      provider varchar(16) NULL, model varchar(100) NULL,
      ciphertext varbinary(16384) NULL, nonce binary(12) NULL, tag binary(16) NULL, key_version varchar(32) NULL,
      revision int unsigned NOT NULL DEFAULT 0,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      CONSTRAINT fk_ai_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE ai_usage_counters (
      scope varchar(64) NOT NULL, window_key varchar(32) NOT NULL, calls int unsigned NOT NULL,
      PRIMARY KEY (scope, window_key)
    ) ENGINE=InnoDB`);
    await q.query(
      `CREATE TABLE ai_usage_lock (id tinyint NOT NULL PRIMARY KEY) ENGINE=InnoDB`,
    );
    await q.query('INSERT INTO ai_usage_lock (id) VALUES (1)');
    await q.query(`CREATE TABLE ai_usage_leases (
      id char(36) NOT NULL PRIMARY KEY, user_id char(36) NOT NULL, shared boolean NOT NULL,
      expires_at datetime(3) NOT NULL, KEY ix_ai_lease_expiry (expires_at), KEY ix_ai_lease_user (user_id),
      CONSTRAINT fk_ai_lease_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(q: QueryRunner): Promise<void> {
    for (const table of [
      'ai_usage_leases',
      'ai_usage_lock',
      'ai_usage_counters',
      'user_ai_settings',
    ])
      await q.query(`DROP TABLE ${table}`);
  }
}
