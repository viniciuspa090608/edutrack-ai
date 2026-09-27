import {
  flashcardGenerationSchema,
  flashcardPreviewSchema,
  confirmFlashcardGenerationSchema,
  flashcardAIResultSchema,
  deckSchema,
} from '@study-platform/contracts';
import type { ConfirmFlashcardGeneration } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
const path = (deckId: string) =>
  `/flashcard-decks/${deckSchema.shape.id.parse(deckId)}/ai-generations`;
export async function generateFlashcards(deckId: string, text: string) {
  return flashcardPreviewSchema.parse(
    await (
      await send(path(deckId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flashcardGenerationSchema.parse({ text })),
      })
    ).json(),
  );
}
export async function confirmFlashcards(input: ConfirmFlashcardGeneration) {
  const value = confirmFlashcardGenerationSchema.parse(input);
  return flashcardAIResultSchema.parse(
    await (
      await send(`${path(value.deckId)}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      })
    ).json(),
  );
}
