export const pendingReviewSource =
  'flashcard_review_states s JOIN flashcards c ON c.id=s.card_id JOIN flashcard_decks d ON d.id=c.deck_id';

export const pendingReviewCondition = 'd.user_id=? AND s.due_at<=?';

const initial = "JSON_EXTRACT(s.policy_state, '$.intervalSeconds') = 0";
const consolidated =
  "JSON_UNQUOTE(JSON_EXTRACT(s.policy_state, '$.consolidated')) = 'true'";

export const reviewCountColumns = `
  COUNT(CASE WHEN ${initial} THEN 1 END) AS new_count,
  COUNT(CASE WHEN NOT (${initial}) AND NOT (${consolidated}) THEN 1 END) AS learning_count,
  COUNT(CASE WHEN NOT (${initial}) AND ${consolidated} THEN 1 END) AS review_count`;

export type ReviewCountRow = {
  new_count: number;
  learning_count: number;
  review_count: number;
};

export function reviewCounts(row?: ReviewCountRow) {
  return {
    new: Number(row?.new_count ?? 0),
    learning: Number(row?.learning_count ?? 0),
    review: Number(row?.review_count ?? 0),
  };
}
