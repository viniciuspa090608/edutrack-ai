import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssistantConversationCreatedAt20261120000000 implements MigrationInterface {
  name = 'AddAssistantConversationCreatedAt20261120000000';

  async up(query: QueryRunner): Promise<void> {
    await query.query(
      'ALTER TABLE assistant_conversations ADD COLUMN created_at datetime(3) NULL',
    );
    await query.query(`UPDATE assistant_conversations c SET created_at = COALESCE(
      (SELECT MIN(m.created_at) FROM assistant_messages m
       WHERE m.user_id=c.user_id AND m.conversation_id=c.id), c.updated_at)`);
    await query.query(
      'ALTER TABLE assistant_conversations MODIFY created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)',
    );
  }

  async down(query: QueryRunner): Promise<void> {
    await query.query(
      'ALTER TABLE assistant_conversations DROP COLUMN created_at',
    );
  }
}
