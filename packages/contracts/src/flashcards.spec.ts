import { expect, it } from 'vitest';
import {
  createDeckSchema,
  updateDeckSchema,
  createCardSchema,
  updateCardSchema,
  flashcardPaginationSchema,
  cardSummarySchema,
} from './flashcards.js';
it('represents absent association and distinguishes omission from removal', () => {
  expect(createDeckSchema.parse({ name: ' Baralho ' })).toEqual({
    name: 'Baralho',
    description: null,
    subjectId: null,
  });
  expect(updateDeckSchema.parse({ name: 'Novo' })).not.toHaveProperty(
    'subjectId',
  );
  expect(updateDeckSchema.parse({ subjectId: null })).toEqual({
    subjectId: null,
  });
  expect(flashcardPaginationSchema.parse({})).toEqual({
    page: 1,
    pageSize: 20,
  });
});
it('rejects empty text, malformed IDs, extra fields, empty patches and excessive lengths', () => {
  for (const input of [
    { name: ' ' },
    { name: 'x', subjectId: 'bad' },
    { name: 'x', userId: 'bad' },
    { name: 'x'.repeat(121) },
    { name: 'x', description: 'x'.repeat(1001) },
  ])
    expect(createDeckSchema.safeParse(input).success).toBe(false);
  for (const input of [
    { front: ' ', back: 'a' },
    { front: 'a', back: '' },
    { front: 'a', back: 'b', extra: true },
    { front: 'x'.repeat(2001), back: 'b' },
    { front: 'a', back: 'x'.repeat(4001) },
  ])
    expect(createCardSchema.safeParse(input).success).toBe(false);
  expect(updateDeckSchema.safeParse({}).success).toBe(false);
  expect(updateCardSchema.safeParse({}).success).toBe(false);
  expect(flashcardPaginationSchema.safeParse({ pageSize: 101 }).success).toBe(
    false,
  );
  expect(createCardSchema.parse({ front: ' a\nb ', back: ' c ' })).toEqual({
    front: 'a\nb',
    back: 'c',
  });
  expect(cardSummarySchema.shape).not.toHaveProperty('back');
});
