import { expect, it } from 'vitest';
import {
  flashcardGenerationSchema,
  flashcardAIOutputSchema,
  generatedCardsSchema,
  flashcardPreviewSchema,
  confirmFlashcardGenerationSchema,
} from './flashcard-ai.js';
const id = '00000000-0000-4000-8000-000000000001';
const card = { id, front: 'Pergunta', back: 'Resposta' };
it('bounds input and all cards and rejects unknown fields and duplicate or invalid IDs', () => {
  expect(flashcardGenerationSchema.parse({ text: ' Assunto ' }).text).toBe(
    'Assunto',
  );
  for (const input of [
    { text: ' ' },
    { text: 'x'.repeat(10001) },
    { text: 'ok', userId: id },
  ])
    expect(flashcardGenerationSchema.safeParse(input).success).toBe(false);
  expect(
    flashcardGenerationSchema.safeParse({ text: 'x'.repeat(10000) }).success,
  ).toBe(true);
  expect(
    flashcardAIOutputSchema.safeParse({
      cards: [{ front: 'x'.repeat(2000), back: 'x'.repeat(4000) }],
    }).success,
  ).toBe(true);
  for (const cards of [
    [],
    Array.from({ length: 21 }, () => ({ front: 'Q', back: 'A' })),
    [{ front: 'Q', back: '' }],
    [{ front: 'x'.repeat(2001), back: 'A' }],
    [{ front: 'Q', back: 'x'.repeat(4001) }],
    [{ front: 'Q', back: 'A', id }],
  ])
    expect(flashcardAIOutputSchema.safeParse({ cards }).success).toBe(false);
  expect(generatedCardsSchema.safeParse([card, card]).success).toBe(false);
  expect(generatedCardsSchema.safeParse([{ ...card, id: 'bad' }]).success).toBe(
    false,
  );
  const preview = {
    deckId: id,
    deckName: 'Deck',
    text: 'Assunto',
    generationId: id,
    expiresAt: '2026-09-27T12:00:00Z',
    receipt: 'proof',
    cards: [card],
  };
  expect(flashcardPreviewSchema.safeParse(preview).success).toBe(true);
  const confirm = { deckId: id, receipt: 'proof', cards: [card] };
  expect(confirmFlashcardGenerationSchema.safeParse(confirm).success).toBe(
    true,
  );
  for (const invalid of [
    { ...confirm, cards: [] },
    { ...confirm, deckId: 'bad' },
    { ...confirm, secret: 'extra' },
    { ...confirm, cards: [{ ...card, back: '' }] },
  ])
    expect(confirmFlashcardGenerationSchema.safeParse(invalid).success).toBe(
      false,
    );
});
