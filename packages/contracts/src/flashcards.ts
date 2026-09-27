import { z } from 'zod';
import { subjectPaginationSchema } from './subjects.js';

const deckFields = {
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).nullable(),
  subjectId: z.uuid().nullable(),
};
export const createDeckSchema = z
  .object({
    name: deckFields.name,
    description: deckFields.description.optional().default(null),
    subjectId: deckFields.subjectId.optional().default(null),
  })
  .strict();
export const updateDeckSchema = z
  .object(deckFields)
  .partial()
  .strict()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'Envie ao menos um campo.',
  );
const cardFields = {
  front: z.string().trim().min(1).max(2000),
  back: z.string().trim().min(1).max(4000),
};
export const createCardSchema = z.object(cardFields).strict();
export const updateCardSchema = createCardSchema
  .partial()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'Envie ao menos um campo.',
  );
const metadata = {
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
};
export const deckSchema = z.object({ ...deckFields, ...metadata }).strict();
export const cardSchema = z
  .object({ ...cardFields, ...metadata, deckId: z.uuid() })
  .strict();
export const cardSummarySchema = cardSchema.omit({ back: true });
export const flashcardPaginationSchema = subjectPaginationSchema;
const pagination = {
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
};
export const deckListSchema = z
  .object({ items: z.array(deckSchema), ...pagination })
  .strict();
export const cardListSchema = z
  .object({ items: z.array(cardSummarySchema), ...pagination })
  .strict();
export type FlashcardDeck = z.infer<typeof deckSchema>;
export type Flashcard = z.infer<typeof cardSchema>;
export type CardSummary = z.infer<typeof cardSummarySchema>;
export type DeckList = z.infer<typeof deckListSchema>;
export type CardList = z.infer<typeof cardListSchema>;
export type CreateDeck = z.infer<typeof createDeckSchema>;
export type UpdateDeck = z.infer<typeof updateDeckSchema>;
export type CreateCard = z.infer<typeof createCardSchema>;
export type UpdateCard = z.infer<typeof updateCardSchema>;
export type FlashcardPagination = z.infer<typeof flashcardPaginationSchema>;
