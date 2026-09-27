import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateManualFlashcards20260926233000 implements MigrationInterface {
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE flashcard_decks (
      id char(36) PRIMARY KEY, user_id char(36) NOT NULL, subject_id char(36) NULL,
      name varchar(120) NOT NULL, description text NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_decks_owner_created (user_id,created_at,id),
      KEY ix_decks_owner_subject (user_id,subject_id),
      CONSTRAINT fk_decks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_decks_subject FOREIGN KEY (subject_id) REFERENCES study_subjects(id) ON DELETE SET NULL
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE flashcards (
      id char(36) PRIMARY KEY, deck_id char(36) NOT NULL, front text NOT NULL, back text NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_cards_deck_created (deck_id,created_at,id),
      CONSTRAINT fk_cards_deck FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE flashcards');
    await runner.query('DROP TABLE flashcard_decks');
  }
}
