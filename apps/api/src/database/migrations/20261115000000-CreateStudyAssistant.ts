import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudyAssistant20261115000000 implements MigrationInterface {
  name = 'CreateStudyAssistant20261115000000';

  async up(query: QueryRunner): Promise<void> {
    await query.query(`CREATE TABLE assistant_conversations (
      user_id char(36) NOT NULL, id char(36) NOT NULL,
      updated_at datetime(3) NOT NULL,
      PRIMARY KEY (user_id, id),
      KEY ix_assistant_conversations_cursor (user_id, updated_at, id),
      CONSTRAINT fk_assistant_conversation_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await query.query(`CREATE TABLE assistant_messages (
      user_id char(36) NOT NULL, id char(36) NOT NULL,
      conversation_id char(36) NOT NULL,
      role enum('user', 'assistant') NOT NULL, body text NOT NULL,
      created_at datetime(3) NOT NULL, expires_at datetime(3) NOT NULL,
      PRIMARY KEY (user_id, id),
      KEY ix_assistant_messages_cursor (user_id, conversation_id, created_at, id),
      KEY ix_assistant_messages_expiry (expires_at, user_id, id),
      CONSTRAINT fk_assistant_message_conversation FOREIGN KEY (user_id, conversation_id)
        REFERENCES assistant_conversations(user_id, id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await query.query(`CREATE TABLE assistant_attempts (
      user_id char(36) NOT NULL, id char(36) NOT NULL,
      message_id char(36) NOT NULL, reply_id char(36) NULL,
      status enum('pending', 'failed', 'completed') NOT NULL,
      deadline datetime(3) NOT NULL, error_code varchar(64) NULL,
      PRIMARY KEY (user_id, id),
      KEY ix_assistant_attempt_message (user_id, message_id, status, deadline),
      CONSTRAINT fk_assistant_attempt_message FOREIGN KEY (user_id, message_id)
        REFERENCES assistant_messages(user_id, id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await query.query(`CREATE TABLE assistant_previews (
      user_id char(36) NOT NULL, id char(36) NOT NULL,
      message_id char(36) NOT NULL, reply_id char(36) NOT NULL,
      idempotency_key char(36) NOT NULL, action json NOT NULL,
      destination varchar(255) NOT NULL, expires_at datetime(3) NOT NULL,
      PRIMARY KEY (user_id, id),
      UNIQUE KEY uq_assistant_preview_reply (user_id, reply_id),
      CONSTRAINT fk_assistant_preview_origin FOREIGN KEY (user_id, message_id)
        REFERENCES assistant_messages(user_id, id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await query.query(`CREATE TABLE assistant_receipts (
      user_id char(36) NOT NULL, preview_id char(36) NOT NULL,
      result json NOT NULL,
      PRIMARY KEY (user_id, preview_id),
      CONSTRAINT fk_assistant_receipt_preview FOREIGN KEY (user_id, preview_id)
        REFERENCES assistant_previews(user_id, id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await query.query(`ALTER TABLE ai_usage_leases
      ADD COLUMN assistant boolean NOT NULL DEFAULT FALSE`);
  }

  async down(query: QueryRunner): Promise<void> {
    await query.query('ALTER TABLE ai_usage_leases DROP COLUMN assistant');
    await query.query('DROP TABLE assistant_receipts');
    await query.query('DROP TABLE assistant_previews');
    await query.query('DROP TABLE assistant_attempts');
    await query.query('DROP TABLE assistant_messages');
    await query.query('DROP TABLE assistant_conversations');
  }
}
