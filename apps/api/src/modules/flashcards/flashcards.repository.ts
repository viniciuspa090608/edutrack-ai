import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import type {
  CreateDeck,
  UpdateDeck,
  CreateCard,
  UpdateCard,
  FlashcardPagination,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { initializeCardReviews, resetCardReview } from './review-lifecycle.js';
interface DeckRow {
  id: string;
  subject_id: string | null;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
interface CardRow {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  created_at: Date;
  updated_at: Date;
}
const missing = () =>
  new HttpError(
    404,
    'FLASHCARD_NOT_FOUND',
    'Baralho ou cartão não encontrado.',
  );
const deckDto = (row: DeckRow) => ({
  id: row.id,
  subjectId: row.subject_id,
  name: row.name,
  description: row.description,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});
const cardDto = (row: CardRow) => ({
  id: row.id,
  deckId: row.deck_id,
  front: row.front,
  back: row.back,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});
export class FlashcardsRepository {
  constructor(private readonly source: DataSource) {}
  private async deck(
    manager: EntityManager,
    userId: string,
    id: string,
    lock = false,
  ) {
    const rows = await manager.query<DeckRow[]>(
      `SELECT * FROM flashcard_decks WHERE user_id=? AND id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId, id],
    );
    if (!rows[0]) throw missing();
    return deckDto(rows[0]);
  }
  private async card(
    manager: EntityManager,
    userId: string,
    deckId: string,
    cardId: string,
  ) {
    const rows = await manager.query<CardRow[]>(
      'SELECT c.* FROM flashcards c JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND d.id=? AND c.id=?',
      [userId, deckId, cardId],
    );
    if (!rows[0]) throw missing();
    return cardDto(rows[0]);
  }
  detail(userId: string, id: string) {
    return this.deck(this.source.manager, userId, id);
  }
  cardDetail(userId: string, deckId: string, cardId: string) {
    return this.card(this.source.manager, userId, deckId, cardId);
  }
  list(userId: string, { page, pageSize }: FlashcardPagination) {
    return this.source.transaction(async (manager) => {
      const rows = await manager.query<DeckRow[]>(
        'SELECT * FROM flashcard_decks WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?',
        [userId, pageSize, (page - 1) * pageSize],
      );
      const counts = await manager.query<{ total: number }[]>(
        'SELECT COUNT(*) AS total FROM flashcard_decks WHERE user_id=?',
        [userId],
      );
      return { items: rows.map(deckDto), total: Number(counts[0]!.total) };
    });
  }
  listCards(
    userId: string,
    deckId: string,
    { page, pageSize }: FlashcardPagination,
  ) {
    return this.source.transaction(async (manager) => {
      await this.deck(manager, userId, deckId);
      const rows = await manager.query<Omit<CardRow, 'back'>[]>(
        'SELECT c.id,c.deck_id,c.front,c.created_at,c.updated_at FROM flashcards c JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND d.id=? ORDER BY c.created_at DESC,c.id DESC LIMIT ? OFFSET ?',
        [userId, deckId, pageSize, (page - 1) * pageSize],
      );
      const counts = await manager.query<{ total: number }[]>(
        'SELECT COUNT(*) AS total FROM flashcards c JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND d.id=?',
        [userId, deckId],
      );
      return {
        items: rows.map((row) => ({
          id: row.id,
          deckId: row.deck_id,
          front: row.front,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
        })),
        total: Number(counts[0]!.total),
      };
    });
  }
  private async association<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      // A subject may be deleted after the public ownership check; the transaction rolls back.
      if (
        error instanceof Error &&
        'driverError' in error &&
        (error.driverError as { code?: string }).code ===
          'ER_NO_REFERENCED_ROW_2'
      )
        throw new HttpError(
          404,
          'SUBJECT_NOT_FOUND',
          'Matéria não encontrada.',
        );
      throw error;
    }
  }
  create(userId: string, input: CreateDeck) {
    return this.association(() =>
      this.source.transaction(async (manager) => {
        const id = randomUUID();
        await manager.query(
          'INSERT INTO flashcard_decks (id,user_id,name,description,subject_id) VALUES (?,?,?,?,?)',
          [id, userId, input.name, input.description, input.subjectId],
        );
        return this.deck(manager, userId, id);
      }),
    );
  }
  update(userId: string, id: string, input: UpdateDeck) {
    return this.association(() =>
      this.source.transaction(async (manager) => {
        await this.deck(manager, userId, id, true);
        const columns = {
          name: 'name',
          description: 'description',
          subjectId: 'subject_id',
        } as const;
        const entries = Object.entries(input).filter(
          ([, value]) => value !== undefined,
        ) as Array<[keyof typeof columns, unknown]>;
        await manager.query(
          `UPDATE flashcard_decks SET ${entries.map(([key]) => `${columns[key]}=?`).join(',')} WHERE user_id=? AND id=?`,
          [...entries.map(([, value]) => value), userId, id],
        );
        return this.deck(manager, userId, id);
      }),
    );
  }
  async delete(userId: string, id: string) {
    await this.source.transaction(async (manager) => {
      await this.deck(manager, userId, id, true);
      await manager.query(
        'DELETE FROM flashcard_decks WHERE user_id=? AND id=?',
        [userId, id],
      );
    });
  }
  createCard(userId: string, deckId: string, input: CreateCard) {
    return this.source.transaction(async (manager) => {
      await this.deck(manager, userId, deckId, true);
      const id = randomUUID();
      await manager.query(
        'INSERT INTO flashcards (id,deck_id,front,back) SELECT ?,id,?,? FROM flashcard_decks WHERE user_id=? AND id=?',
        [id, input.front, input.back, userId, deckId],
      );
      await initializeCardReviews(manager, userId, [id]);
      return this.card(manager, userId, deckId, id);
    });
  }
  updateCard(
    userId: string,
    deckId: string,
    cardId: string,
    input: UpdateCard,
  ) {
    return this.source.transaction(async (manager) => {
      await this.deck(manager, userId, deckId, true);
      const previous = await this.card(manager, userId, deckId, cardId);
      const entries = Object.entries(input).filter(
        ([key, value]) =>
          value !== undefined && value !== previous[key as 'front' | 'back'],
      );
      if (!entries.length) return previous;
      await manager.query(
        `UPDATE flashcards c JOIN flashcard_decks d ON d.id=c.deck_id SET ${entries.map(([key]) => `c.${key}=?`).join(',')} WHERE d.user_id=? AND d.id=? AND c.id=?`,
        [...entries.map(([, value]) => value), userId, deckId, cardId],
      );
      await resetCardReview(manager, userId, deckId, cardId);
      return this.card(manager, userId, deckId, cardId);
    });
  }
  async deleteCard(userId: string, deckId: string, cardId: string) {
    await this.source.transaction(async (manager) => {
      await this.deck(manager, userId, deckId, true);
      await this.card(manager, userId, deckId, cardId);
      await manager.query(
        'DELETE c FROM flashcards c JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND d.id=? AND c.id=?',
        [userId, deckId, cardId],
      );
    });
  }
}
