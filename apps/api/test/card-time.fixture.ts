import type { DataSource } from 'typeorm';
import { expect } from 'vitest';

export async function setInitialCardTime(
  source: DataSource,
  cardId: string,
  createdAt: Date,
): Promise<void> {
  const rows = await source.query<
    Array<{ created_at: Date; due_at: Date; revision: number }>
  >(
    'SELECT c.created_at,s.due_at,s.revision FROM flashcards c JOIN flashcard_review_states s ON s.card_id=c.id WHERE c.id=?',
    [cardId],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0]!.revision).toBe(1);
  expect(rows[0]!.due_at).toEqual(rows[0]!.created_at);
  // Keep the initial-state assertion above before aligning this fixture's clock.
  await source.query(
    'UPDATE flashcards c JOIN flashcard_review_states s ON s.card_id=c.id SET c.created_at=?,s.due_at=? WHERE c.id=?',
    [createdAt, createdAt, cardId],
  );
}
