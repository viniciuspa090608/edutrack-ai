import type { EntityManager } from 'typeorm';
import { initialPolicyState, sm2InspiredV1 } from './review-policy.js';
export async function initializeCardReviews(
  manager: EntityManager,
  userId: string,
  ids: readonly string[],
) {
  if (!ids.length) return;
  await manager.query(
    `INSERT INTO flashcard_review_states (card_id,due_at,policy_id,policy_version,policy_state)
    SELECT c.id,c.created_at,?,?,? FROM flashcards c JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND c.id IN (${ids.map(() => '?').join(',')})`,
    [
      sm2InspiredV1.id,
      sm2InspiredV1.version,
      JSON.stringify(initialPolicyState()),
      userId,
      ...ids,
    ],
  );
}
export async function resetCardReview(
  manager: EntityManager,
  userId: string,
  deckId: string,
  cardId: string,
) {
  await manager.query(
    'UPDATE flashcard_review_states s JOIN flashcards c ON c.id=s.card_id JOIN flashcard_decks d ON d.id=c.deck_id SET s.due_at=UTC_TIMESTAMP(3),s.revision=s.revision+1,s.content_generation=s.content_generation+1,s.policy_id=?,s.policy_version=?,s.policy_state=? WHERE d.user_id=? AND d.id=? AND c.id=?',
    [
      sm2InspiredV1.id,
      sm2InspiredV1.version,
      JSON.stringify(initialPolicyState()),
      userId,
      deckId,
      cardId,
    ],
  );
}
