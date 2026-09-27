import {
  createDeckSchema,
  updateDeckSchema,
  createCardSchema,
  updateCardSchema,
  deckSchema,
  cardSchema,
  deckListSchema,
  cardListSchema,
  flashcardPaginationSchema,
} from '@study-platform/contracts';
import type { z } from 'zod';
import type { SubjectsService } from '../subjects/subjects.service.js';
import type { FlashcardsRepository } from './flashcards.repository.js';
import { HttpError } from '../../shared/http-error.js';
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new HttpError(400, 'INVALID_INPUT', 'Dados de flashcards inválidos.');
  return result.data;
}
export class FlashcardsService {
  constructor(
    private readonly repository: FlashcardsRepository,
    private readonly subjects: Pick<SubjectsService, 'requireOwned'>,
  ) {}
  async create(userId: string, input: unknown) {
    const data = parse(createDeckSchema, input);
    if (data.subjectId)
      await this.subjects.requireOwned(userId, data.subjectId);
    return deckSchema.parse(await this.repository.create(userId, data));
  }
  async update(userId: string, id: string, input: unknown) {
    await this.repository.detail(userId, id);
    const data = parse(updateDeckSchema, input);
    if (data.subjectId)
      await this.subjects.requireOwned(userId, data.subjectId);
    return deckSchema.parse(await this.repository.update(userId, id, data));
  }
  async detail(userId: string, id: string) {
    return deckSchema.parse(await this.repository.detail(userId, id));
  }
  delete(userId: string, id: string) {
    return this.repository.delete(userId, id);
  }
  async list(userId: string, input: unknown) {
    const pagination = parse(flashcardPaginationSchema, input);
    const result = await this.repository.list(userId, pagination);
    return deckListSchema.parse({
      ...result,
      ...pagination,
      ...this.pages(pagination, result.total),
    });
  }
  private pages(pagination: { pageSize: number }, total: number) {
    return { totalPages: Math.ceil(total / pagination.pageSize) };
  }
  async listCards(userId: string, deckId: string, input: unknown) {
    const pagination = parse(flashcardPaginationSchema, input);
    const result = await this.repository.listCards(userId, deckId, pagination);
    return cardListSchema.parse({
      ...result,
      ...pagination,
      ...this.pages(pagination, result.total),
    });
  }
  async cardDetail(userId: string, deckId: string, cardId: string) {
    return cardSchema.parse(
      await this.repository.cardDetail(userId, deckId, cardId),
    );
  }
  async createCard(userId: string, deckId: string, input: unknown) {
    return cardSchema.parse(
      await this.repository.createCard(
        userId,
        deckId,
        parse(createCardSchema, input),
      ),
    );
  }
  async updateCard(
    userId: string,
    deckId: string,
    cardId: string,
    input: unknown,
  ) {
    return cardSchema.parse(
      await this.repository.updateCard(
        userId,
        deckId,
        cardId,
        parse(updateCardSchema, input),
      ),
    );
  }
  deleteCard(userId: string, deckId: string, cardId: string) {
    return this.repository.deleteCard(userId, deckId, cardId);
  }
}
