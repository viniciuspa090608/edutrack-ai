import { randomUUID } from 'node:crypto';
import {
  reviewRequestSchema,
  pendingFiltersSchema,
  pendingListSchema,
  flashcardPaginationSchema,
  reviewHistorySchema,
  reviewEventSchema,
} from '@study-platform/contracts';
import type { z } from 'zod';
import type { PreferencesService } from '../preferences/preferences.service.js';
import { HttpError } from '../../shared/http-error.js';
import type { ReviewsRepository } from './reviews.repository.js';
import { PolicyRegistry } from './review-policy.js';
export type ReviewClock = () => Date;
function parse<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new HttpError(
      400,
      'INVALID_REVIEW_INPUT',
      'Dados de revisão inválidos.',
    );
  return result.data;
}
export class ReviewsService {
  constructor(
    private readonly repository: ReviewsRepository,
    private readonly prefs: Pick<PreferencesService, 'requireEnabled'>,
    private readonly clock: ReviewClock = () => new Date(),
    private readonly registry = new PolicyRegistry(),
  ) {}
  async pending(userId: string, input: unknown) {
    const filters = parse(pendingFiltersSchema, input);
    const result = await this.repository.pending(userId, filters, this.clock());
    return pendingListSchema.parse({
      ...result,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(result.total / filters.pageSize),
    });
  }
  state(userId: string, deckId: string, cardId: string) {
    return this.repository.state(userId, deckId, cardId);
  }
  detail(userId: string, deckId: string, cardId: string) {
    return this.repository.detail(userId, deckId, cardId);
  }
  async history(
    userId: string,
    deckId: string,
    cardId: string,
    input: unknown,
  ) {
    const pagination = parse(flashcardPaginationSchema, input);
    const result = await this.repository.history(
      userId,
      deckId,
      cardId,
      pagination,
    );
    return reviewHistorySchema.parse({
      ...result,
      ...pagination,
      totalPages: Math.ceil(result.total / pagination.pageSize),
    });
  }
  async rate(userId: string, deckId: string, cardId: string, input: unknown) {
    const request = parse(reviewRequestSchema, input);
    return this.repository.locked(
      userId,
      deckId,
      cardId,
      async (manager, state) => {
        await this.prefs.requireEnabled(userId, 'flashcards');
        const prior = await this.repository.prior(
          manager,
          userId,
          request.idempotencyKey,
        );
        if (prior) {
          if (
            prior.cardId !== cardId ||
            prior.rating !== request.rating ||
            prior.previousState.revision !== request.expectedRevision
          )
            throw new HttpError(
              409,
              'REVIEW_KEY_CONFLICT',
              'Esta chave já foi usada em outra avaliação.',
            );
          return prior;
        }
        if (state.revision !== request.expectedRevision)
          throw new HttpError(
            409,
            'REVIEW_REVISION_CONFLICT',
            'O cartão foi atualizado. Recarregue a fila antes de avaliar.',
          );
        const reviewedAt = this.clock();
        if (new Date(state.dueAt) > reviewedAt)
          throw new HttpError(
            409,
            'REVIEW_NOT_DUE',
            'A próxima revisão deste cartão ainda não chegou.',
          );
        const policy = this.registry.resolve(
          state.policyId,
          state.policyVersion,
        );
        const decision = policy.next(
          state.policyState,
          request.rating,
          reviewedAt,
        );
        const next = {
          ...state,
          dueAt: decision.dueAt.toISOString(),
          revision: state.revision + 1,
          policyState: decision.state,
        };
        const event = reviewEventSchema.parse({
          id: randomUUID(),
          cardId,
          rating: request.rating,
          reviewedAt: reviewedAt.toISOString(),
          intervalSeconds: decision.intervalSeconds,
          dueAt: next.dueAt,
          policyId: policy.id,
          policyVersion: policy.version,
          contentGeneration: state.contentGeneration,
          idempotencyKey: request.idempotencyKey,
          previousState: state,
          newState: next,
        });
        await this.repository.save(manager, userId, deckId, event);
        return event;
      },
    );
  }
}
