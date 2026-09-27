import type { DataSource, EntityManager } from 'typeorm';
import {
  reviewStateSchema,
  reviewEventSchema,
  scheduledCardSchema,
} from '@study-platform/contracts';
import type { PendingFilters, ReviewEvent } from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
interface StateRow {
  card_id: string;
  due_at: Date;
  revision: number;
  content_generation: number;
  policy_id: string;
  policy_version: number;
  policy_state: unknown;
}
interface EventRow {
  id: string;
  card_id: string;
  rating: ReviewEvent['rating'];
  reviewed_at: Date;
  interval_seconds: number;
  due_at: Date;
  policy_id: string;
  policy_version: number;
  content_generation: number;
  idempotency_key: string;
  previous_state: unknown;
  new_state: unknown;
}
const json = (value: unknown) =>
  typeof value === 'string' ? (JSON.parse(value) as unknown) : value;
const stateDto = (row: StateRow) =>
  reviewStateSchema.parse({
    cardId: row.card_id,
    dueAt: row.due_at.toISOString(),
    revision: row.revision,
    contentGeneration: row.content_generation,
    policyId: row.policy_id,
    policyVersion: row.policy_version,
    policyState: json(row.policy_state),
  });
const eventDto = (row: EventRow) =>
  reviewEventSchema.parse({
    id: row.id,
    cardId: row.card_id,
    rating: row.rating,
    reviewedAt: row.reviewed_at.toISOString(),
    intervalSeconds: row.interval_seconds,
    dueAt: row.due_at.toISOString(),
    policyId: row.policy_id,
    policyVersion: row.policy_version,
    contentGeneration: row.content_generation,
    idempotencyKey: row.idempotency_key,
    previousState: json(row.previous_state),
    newState: json(row.new_state),
  });
const missing = () =>
  new HttpError(404, 'REVIEW_NOT_FOUND', 'Cartão ou baralho não encontrado.');
export class ReviewsRepository {
  constructor(private readonly source: DataSource) {}
  detail(userId: string, deckId: string, cardId: string) {
    return this.source.transaction(async (manager) => {
      const state = await this.state(userId, deckId, cardId, manager);
      const rows = await manager.query<
        Array<{
          id: string;
          deck_id: string;
          front: string;
          back: string;
          created_at: Date;
          updated_at: Date;
        }>
      >(
        'SELECT c.* FROM flashcards c JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND d.id=? AND c.id=?',
        [userId, deckId, cardId],
      );
      const row = rows[0];
      if (!row) throw missing();
      return scheduledCardSchema.parse({
        state,
        card: {
          id: row.id,
          deckId: row.deck_id,
          front: row.front,
          back: row.back,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        },
      });
    });
  }
  async requireDeck(
    userId: string,
    deckId: string,
    manager = this.source.manager,
    lock = false,
  ) {
    const rows = await manager.query<{ id: string }[]>(
      `SELECT id FROM flashcard_decks WHERE user_id=? AND id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId, deckId],
    );
    if (!rows[0]) throw missing();
  }
  async state(
    userId: string,
    deckId: string,
    cardId: string,
    manager = this.source.manager,
    lock = false,
  ) {
    const rows = await manager.query<StateRow[]>(
      `SELECT s.* FROM flashcard_review_states s JOIN flashcards c ON c.id=s.card_id JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND d.id=? AND c.id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId, deckId, cardId],
    );
    if (!rows[0]) throw missing();
    return stateDto(rows[0]);
  }
  async locked<T>(
    userId: string,
    deckId: string,
    cardId: string,
    work: (
      manager: EntityManager,
      state: ReturnType<typeof stateDto>,
    ) => Promise<T>,
  ) {
    try {
      return await this.source.transaction(async (manager) => {
        await this.requireDeck(userId, deckId, manager, true);
        return work(
          manager,
          await this.state(userId, deckId, cardId, manager, true),
        );
      });
    } catch (error) {
      if (
        error instanceof Error &&
        'driverError' in error &&
        (error.driverError as { code?: string }).code === 'ER_DUP_ENTRY'
      )
        throw new HttpError(
          409,
          'REVIEW_KEY_CONFLICT',
          'Esta chave já foi usada em outra avaliação.',
        );
      throw error;
    }
  }
  async prior(manager: EntityManager, userId: string, key: string) {
    const rows = await manager.query<EventRow[]>(
      'SELECT e.* FROM flashcard_review_events e JOIN flashcards c ON c.id=e.card_id JOIN flashcard_decks d ON d.id=c.deck_id WHERE e.user_id=? AND d.user_id=? AND e.idempotency_key=?',
      [userId, userId, key],
    );
    return rows[0] ? eventDto(rows[0]) : null;
  }
  async save(
    manager: EntityManager,
    userId: string,
    deckId: string,
    event: ReviewEvent,
  ) {
    await manager.query(
      'UPDATE flashcard_review_states s JOIN flashcards c ON c.id=s.card_id JOIN flashcard_decks d ON d.id=c.deck_id SET s.due_at=?,s.revision=?,s.policy_state=? WHERE d.user_id=? AND d.id=? AND c.id=?',
      [
        new Date(event.dueAt),
        event.newState.revision,
        JSON.stringify(event.newState.policyState),
        userId,
        deckId,
        event.cardId,
      ],
    );
    await manager.query(
      'INSERT INTO flashcard_review_events (id,card_id,user_id,rating,reviewed_at,interval_seconds,due_at,policy_id,policy_version,content_generation,idempotency_key,previous_state,new_state) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        event.id,
        event.cardId,
        userId,
        event.rating,
        new Date(event.reviewedAt),
        event.intervalSeconds,
        new Date(event.dueAt),
        event.policyId,
        event.policyVersion,
        event.contentGeneration,
        event.idempotencyKey,
        JSON.stringify(event.previousState),
        JSON.stringify(event.newState),
      ],
    );
  }
  pending(userId: string, filters: PendingFilters, now: Date) {
    return this.source.transaction(async (manager) => {
      if (filters.deckId)
        await this.requireDeck(userId, filters.deckId, manager);
      const where = `d.user_id=? AND s.due_at<=?${filters.deckId ? ' AND d.id=?' : ''}`;
      const values = [userId, now, ...(filters.deckId ? [filters.deckId] : [])];
      const rows = await manager.query<
        Array<{
          id: string;
          deck_id: string;
          deck_name: string;
          front: string;
          due_at: Date;
          revision: number;
          content_generation: number;
        }>
      >(
        `SELECT c.id,c.deck_id,d.name AS deck_name,c.front,s.due_at,s.revision,s.content_generation FROM flashcard_review_states s JOIN flashcards c ON c.id=s.card_id JOIN flashcard_decks d ON d.id=c.deck_id WHERE ${where} ORDER BY s.due_at,c.id LIMIT ? OFFSET ?`,
        [...values, filters.pageSize, (filters.page - 1) * filters.pageSize],
      );
      const counts = await manager.query<{ total: number }[]>(
        `SELECT COUNT(*) AS total FROM flashcard_review_states s JOIN flashcards c ON c.id=s.card_id JOIN flashcard_decks d ON d.id=c.deck_id WHERE ${where}`,
        values,
      );
      return {
        items: rows.map((row) => ({
          id: row.id,
          deckId: row.deck_id,
          deckName: row.deck_name,
          front: row.front,
          dueAt: row.due_at.toISOString(),
          revision: row.revision,
          contentGeneration: row.content_generation,
        })),
        total: Number(counts[0]!.total),
      };
    });
  }
  history(
    userId: string,
    deckId: string,
    cardId: string,
    { page, pageSize }: Pick<PendingFilters, 'page' | 'pageSize'>,
  ) {
    return this.source.transaction(async (manager) => {
      await this.state(userId, deckId, cardId, manager);
      const rows = await manager.query<EventRow[]>(
        'SELECT e.* FROM flashcard_review_events e JOIN flashcards c ON c.id=e.card_id JOIN flashcard_decks d ON d.id=c.deck_id WHERE e.user_id=? AND d.user_id=? AND d.id=? AND c.id=? ORDER BY e.reviewed_at DESC,e.id DESC LIMIT ? OFFSET ?',
        [userId, userId, deckId, cardId, pageSize, (page - 1) * pageSize],
      );
      const counts = await manager.query<{ total: number }[]>(
        'SELECT COUNT(*) AS total FROM flashcard_review_events e JOIN flashcards c ON c.id=e.card_id JOIN flashcard_decks d ON d.id=c.deck_id WHERE e.user_id=? AND d.user_id=? AND d.id=? AND c.id=?',
        [userId, userId, deckId, cardId],
      );
      return { items: rows.map(eventDto), total: Number(counts[0]!.total) };
    });
  }
}
