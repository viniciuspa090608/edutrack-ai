import { z } from 'zod';
import { createCardSchema, cardSchema } from './flashcards.js';
export const flashcardGenerationSchema = z
  .object({ text: z.string().trim().min(1).max(10000) })
  .strict();
export const flashcardAIOutputSchema = z
  .object({ cards: z.array(createCardSchema).min(1).max(20) })
  .strict();
export const generatedCardSchema = createCardSchema
  .extend({ id: z.uuid() })
  .strict();
export const generatedCardsSchema = z
  .array(generatedCardSchema)
  .min(1)
  .max(20)
  .refine(
    (cards) => new Set(cards.map((card) => card.id)).size === cards.length,
    'IDs repetidos.',
  );
export const flashcardPreviewSchema = z
  .object({
    deckId: z.uuid(),
    deckName: z.string().min(1).max(120),
    text: flashcardGenerationSchema.shape.text,
    generationId: z.uuid(),
    expiresAt: z.iso.datetime(),
    receipt: z.string().min(1).max(4096),
    cards: generatedCardsSchema,
  })
  .strict();
export const confirmFlashcardGenerationSchema = z
  .object({
    deckId: z.uuid(),
    receipt: z.string().min(1).max(4096),
    cards: generatedCardsSchema,
  })
  .strict();
export const flashcardAIResultSchema = z
  .object({
    generationId: z.uuid(),
    deckId: z.uuid(),
    cards: z.array(cardSchema).min(1).max(20),
  })
  .strict();
export type GeneratedCard = z.infer<typeof generatedCardSchema>;
export type FlashcardPreview = z.infer<typeof flashcardPreviewSchema>;
export type ConfirmFlashcardGeneration = z.infer<
  typeof confirmFlashcardGenerationSchema
>;
export type FlashcardAIResult = z.infer<typeof flashcardAIResultSchema>;
