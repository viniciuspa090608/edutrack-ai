import {
  deckSchema,
  pendingFiltersSchema,
  pendingListSchema,
  scheduledCardSchema,
  reviewRequestSchema,
  reviewEventSchema,
  reviewHistorySchema,
  flashcardPaginationSchema,
} from '@study-platform/contracts';
import type { ReviewRequest } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
const cardPath = (deckId: string, cardId: string) =>
  `/flashcard-decks/${deckSchema.shape.id.parse(deckId)}/cards/${deckSchema.shape.id.parse(cardId)}`;
export async function pendingReviews(page = 1, deckId?: string) {
  const filters = pendingFiltersSchema.parse({
    page,
    ...(deckId ? { deckId } : {}),
  });
  return pendingListSchema.parse(
    await (
      await send(
        `/flashcard-decks/reviews/pending?page=${filters.page}&pageSize=${filters.pageSize}${filters.deckId ? `&deckId=${filters.deckId}` : ''}`,
      )
    ).json(),
  );
}
export async function scheduledCard(deckId: string, cardId: string) {
  return scheduledCardSchema.parse(
    await (await send(`${cardPath(deckId, cardId)}/review`)).json(),
  );
}
export async function rateCard(
  deckId: string,
  cardId: string,
  input: ReviewRequest,
) {
  return reviewEventSchema.parse(
    await (
      await send(`${cardPath(deckId, cardId)}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewRequestSchema.parse(input)),
      })
    ).json(),
  );
}
export async function reviewHistory(deckId: string, cardId: string, page = 1) {
  const query = flashcardPaginationSchema.parse({ page });
  return reviewHistorySchema.parse(
    await (
      await send(
        `${cardPath(deckId, cardId)}/reviews?page=${query.page}&pageSize=${query.pageSize}`,
      )
    ).json(),
  );
}
