import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateFlashcardAIConfirmations20260927233000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE flashcard_ai_confirmations (
      generation_id char(36) PRIMARY KEY, user_id char(36) NOT NULL, deck_id char(36) NOT NULL,
      result json NOT NULL, confirmed_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      KEY ix_flashcard_ai_owner (user_id,deck_id),
      CONSTRAINT fk_flashcard_ai_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_flashcard_ai_deck FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE flashcard_ai_confirmations');
  }
}
