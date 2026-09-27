import { z } from 'zod';
import { flashcardPaginationSchema, cardSchema } from './flashcards.js';
export const reviewRatingSchema = z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']);
export const reviewRequestSchema = z
  .object({
    rating: reviewRatingSchema,
    expectedRevision: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    idempotencyKey: z.uuid(),
  })
  .strict();
export const reviewPolicyStateSchema = z
  .object({
    intervalSeconds: z
      .number()
      .int()
      .min(0)
      .max(365 * 86400),
    ease: z.number().min(1.3).max(3),
    successStreak: z.number().int().nonnegative(),
    consolidated: z.boolean(),
  })
  .strict();
export const reviewStateSchema = z
  .object({
    cardId: z.uuid(),
    dueAt: z.iso.datetime(),
    revision: z.number().int().positive(),
    contentGeneration: z.number().int().positive(),
    policyId: z.string().min(1).max(80),
    policyVersion: z.number().int().positive(),
    policyState: reviewPolicyStateSchema,
  })
  .strict();
export const pendingFiltersSchema = flashcardPaginationSchema
  .extend({ deckId: z.uuid().optional() })
  .strict();
export const pendingCardSchema = z
  .object({
    id: z.uuid(),
    deckId: z.uuid(),
    deckName: z.string(),
    front: cardSchema.shape.front,
    dueAt: z.iso.datetime(),
    revision: z.number().int().positive(),
    contentGeneration: z.number().int().positive(),
  })
  .strict();
const pagination = {
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
};
export const pendingListSchema = z
  .object({ items: z.array(pendingCardSchema), ...pagination })
  .strict();
export const scheduledCardSchema = z
  .object({ card: cardSchema, state: reviewStateSchema })
  .strict();
export const reviewEventSchema = z
  .object({
    id: z.uuid(),
    cardId: z.uuid(),
    rating: reviewRatingSchema,
    reviewedAt: z.iso.datetime(),
    intervalSeconds: z
      .number()
      .int()
      .positive()
      .max(365 * 86400),
    dueAt: z.iso.datetime(),
    policyId: z.string().min(1).max(80),
    policyVersion: z.number().int().positive(),
    contentGeneration: z.number().int().positive(),
    idempotencyKey: z.uuid(),
    previousState: reviewStateSchema,
    newState: reviewStateSchema,
  })
  .strict();
export const reviewHistorySchema = z
  .object({ items: z.array(reviewEventSchema), ...pagination })
  .strict();
export type ReviewRating = z.infer<typeof reviewRatingSchema>;
export type ReviewRequest = z.infer<typeof reviewRequestSchema>;
export type ReviewPolicyState = z.infer<typeof reviewPolicyStateSchema>;
export type ReviewState = z.infer<typeof reviewStateSchema>;
export type PendingFilters = z.infer<typeof pendingFiltersSchema>;
export type PendingList = z.infer<typeof pendingListSchema>;
export type ScheduledCard = z.infer<typeof scheduledCardSchema>;
export type ReviewEvent = z.infer<typeof reviewEventSchema>;
export type ReviewHistory = z.infer<typeof reviewHistorySchema>;
