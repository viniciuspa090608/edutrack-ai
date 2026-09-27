import { expect, it } from 'vitest';
import {
  reviewRequestSchema,
  reviewPolicyStateSchema,
  pendingFiltersSchema,
  pendingCardSchema,
} from './reviews.js';
const key = '00000000-0000-4000-8000-000000000001';
it('validates four ratings, expected revisions and UUID keys and rejects extra external fields', () => {
  for (const rating of ['AGAIN', 'HARD', 'GOOD', 'EASY'])
    expect(
      reviewRequestSchema.parse({
        rating,
        expectedRevision: 1,
        idempotencyKey: key,
      }).rating,
    ).toBe(rating);
  for (const input of [
    { rating: 'OTHER' },
    { expectedRevision: 0 },
    { idempotencyKey: 'bad' },
    { userId: key },
    { reviewedAt: '2026-10-01T00:00:00Z' },
  ])
    expect(
      reviewRequestSchema.safeParse({
        rating: 'GOOD',
        expectedRevision: 1,
        idempotencyKey: key,
        ...input,
      }).success,
    ).toBe(false);
  expect(pendingFiltersSchema.safeParse({ deckId: 'bad' }).success).toBe(false);
  expect(pendingCardSchema.shape).not.toHaveProperty('back');
  expect(
    reviewPolicyStateSchema.safeParse({
      intervalSeconds: 0,
      ease: 1,
      successStreak: 0,
      consolidated: false,
    }).success,
  ).toBe(false);
});
