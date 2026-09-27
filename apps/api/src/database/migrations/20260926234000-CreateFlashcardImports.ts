import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateFlashcardImports20260926234000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE flashcard_import_attempts (
      id char(36) PRIMARY KEY, user_id char(36) NOT NULL, deck_id char(36) NOT NULL,
      format enum('csv','tsv') NOT NULL, state enum('uploaded','preview','completed') NOT NULL DEFAULT 'uploaded',
      file_bytes mediumblob NULL, preview json NULL, result json NULL,
      expires_at datetime(3) NOT NULL, created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      KEY ix_import_owner_deck (user_id,deck_id,id), KEY ix_import_expiration (expires_at),
      CONSTRAINT fk_import_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_import_deck FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE flashcard_import_attempts');
  }
}
