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
import type { UpdateDeck, UpdateCard } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
const root = '/flashcard-decks';
const id = (value: string) => deckSchema.shape.id.parse(value);
async function write(path: string, method: string, body: object) {
  return send(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
export async function listDecks(page = 1) {
  const query = flashcardPaginationSchema.parse({ page });
  return deckListSchema.parse(
    await (
      await send(`${root}?page=${query.page}&pageSize=${query.pageSize}`)
    ).json(),
  );
}
export async function deckDetail(deckId: string) {
  return deckSchema.parse(await (await send(`${root}/${id(deckId)}`)).json());
}
export async function saveDeck(deckId: string | null, input: UpdateDeck) {
  return deckSchema.parse(
    await (
      await write(
        deckId ? `${root}/${id(deckId)}` : root,
        deckId ? 'PATCH' : 'POST',
        deckId ? updateDeckSchema.parse(input) : createDeckSchema.parse(input),
      )
    ).json(),
  );
}
export async function deleteDeck(deckId: string) {
  await write(`${root}/${id(deckId)}`, 'DELETE', {});
}
export async function listCards(deckId: string, page = 1) {
  const query = flashcardPaginationSchema.parse({ page });
  return cardListSchema.parse(
    await (
      await send(
        `${root}/${id(deckId)}/cards?page=${query.page}&pageSize=${query.pageSize}`,
      )
    ).json(),
  );
}
export async function cardDetail(deckId: string, cardId: string) {
  return cardSchema.parse(
    await (await send(`${root}/${id(deckId)}/cards/${id(cardId)}`)).json(),
  );
}
export async function saveCard(
  deckId: string,
  cardId: string | null,
  input: UpdateCard,
) {
  return cardSchema.parse(
    await (
      await write(
        `${root}/${id(deckId)}/cards${cardId ? `/${id(cardId)}` : ''}`,
        cardId ? 'PATCH' : 'POST',
        cardId ? updateCardSchema.parse(input) : createCardSchema.parse(input),
      )
    ).json(),
  );
}
export async function deleteCard(deckId: string, cardId: string) {
  await write(`${root}/${id(deckId)}/cards/${id(cardId)}`, 'DELETE', {});
}
