import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateSpacedRepetition20260926235000 implements MigrationInterface {
  static async backfillReviewStates(runner: Pick<QueryRunner, 'query'>) {
    await runner.query(`INSERT IGNORE INTO flashcard_review_states (card_id,due_at,policy_state)
    SELECT id,UTC_TIMESTAMP(3),JSON_OBJECT('intervalSeconds',0,'ease',2.5,'successStreak',0,'consolidated',JSON_EXTRACT('false','$')) FROM flashcards`);
  }
  async up(runner: QueryRunner): Promise<void> {
    await runner.query(`CREATE TABLE flashcard_review_states (
      card_id char(36) PRIMARY KEY, due_at datetime(3) NOT NULL, revision int unsigned NOT NULL DEFAULT 1,
      content_generation int unsigned NOT NULL DEFAULT 1, policy_id varchar(80) NOT NULL DEFAULT 'sm2-inspired',
      policy_version int unsigned NOT NULL DEFAULT 1, policy_state json NOT NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      KEY ix_review_due (due_at,card_id), CONSTRAINT fk_review_state_card FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await runner.query(`CREATE TABLE flashcard_review_events (
      id char(36) PRIMARY KEY,card_id char(36) NOT NULL,user_id char(36) NOT NULL,
      rating enum('AGAIN','HARD','GOOD','EASY') NOT NULL,reviewed_at datetime(3) NOT NULL,interval_seconds int unsigned NOT NULL,due_at datetime(3) NOT NULL,
      policy_id varchar(80) NOT NULL,policy_version int unsigned NOT NULL,content_generation int unsigned NOT NULL,
      idempotency_key char(36) NOT NULL,previous_state json NOT NULL,new_state json NOT NULL,
      UNIQUE KEY uq_review_idempotency (user_id,idempotency_key),KEY ix_review_card_history (card_id,reviewed_at,id),
      CONSTRAINT fk_review_event_card FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE,
      CONSTRAINT fk_review_event_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await CreateSpacedRepetition20260926235000.backfillReviewStates(runner);
  }
  async down(runner: QueryRunner): Promise<void> {
    await runner.query('DROP TABLE flashcard_review_events');
    await runner.query('DROP TABLE flashcard_review_states');
  }
}
