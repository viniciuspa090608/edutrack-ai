import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReviewEvent, ScheduledCard } from '@study-platform/contracts';
import { ReviewQueue } from './ReviewQueue.js';

const id = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const now = '2026-09-26T12:00:00.000Z';
const state = {
  cardId: id,
  dueAt: now,
  revision: 1,
  contentGeneration: 1,
  policyId: 'sm2-inspired',
  policyVersion: 1,
  policyState: {
    intervalSeconds: 0,
    ease: 2.5,
    successStreak: 0,
    consolidated: false,
  },
};
const scheduled: ScheduledCard = {
  card: {
    id,
    deckId: id,
    front: 'Pergunta inicial',
    back: 'Resposta secreta',
    createdAt: now,
    updatedAt: now,
  },
  state,
  intervals: { AGAIN: 600, HARD: 86400, GOOD: 259200, EASY: 432000 },
};
const event: ReviewEvent = {
  id: other,
  cardId: id,
  rating: 'GOOD',
  reviewedAt: now,
  dueAt: '2026-09-29T12:00:00.000Z',
  intervalSeconds: 259200,
  policyId: state.policyId,
  policyVersion: 1,
  contentGeneration: 1,
  idempotencyKey: other,
  previousState: state,
  newState: {
    ...state,
    revision: 2,
    dueAt: '2026-09-29T12:00:00.000Z',
    policyState: {
      intervalSeconds: 259200,
      ease: 2.5,
      successStreak: 1,
      consolidated: true,
    },
  },
};
let queueError: boolean,
  postError: 'network' | 'conflict' | '',
  rated: boolean,
  historyError: boolean,
  empty: boolean;
const writes: Array<Record<string, unknown>> = [];
const reads: string[] = [];
beforeEach(() => {
  queueError = false;
  postError = '';
  rated = false;
  historyError = false;
  empty = false;
  writes.length = 0;
  reads.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input),
        page = Number(url.searchParams.get('page') ?? 1);
      if (init?.method === 'POST') {
        const payload = JSON.parse(init.body as string) as Record<
          string,
          unknown
        >;
        writes.push(payload);
        if (postError === 'network') throw new Error('connection lost');
        if (postError === 'conflict')
          return Response.json(
            { error: { code: 'REVIEW_REVISION_CONFLICT' } },
            { status: 409 },
          );
        rated = true;
        return Response.json({
          ...event,
          rating: payload.rating,
          idempotencyKey: payload.idempotencyKey,
        });
      }
      reads.push(url.pathname + url.search);
      if (url.pathname.endsWith('/pending')) {
        if (queueError) throw new Error('offline');
        const items = empty
          ? []
          : [
              {
                id: rated || page === 2 ? other : id,
                deckId: id,
                deckName: 'Álgebra',
                front:
                  rated || page === 2
                    ? 'Pergunta seguinte'
                    : 'Pergunta inicial',
                dueAt: now,
                revision: 1,
                contentGeneration: 1,
              },
            ];
        return Response.json({
          items,
          page,
          pageSize: 20,
          total: empty ? 0 : rated ? 1 : 21,
          totalPages: empty ? 0 : rated ? 1 : 2,
        });
      }
      if (url.pathname.endsWith('/reviews')) {
        if (historyError) throw new Error('offline');
        return Response.json({
          items: empty
            ? []
            : [{ ...event, rating: page === 1 ? 'GOOD' : 'AGAIN' }],
          page,
          pageSize: 20,
          total: empty ? 0 : 21,
          totalPages: empty ? 0 : 2,
        });
      }
      return Response.json(
        url.pathname.includes(other)
          ? {
              ...scheduled,
              card: {
                ...scheduled.card,
                id: other,
                front: 'Pergunta seguinte',
              },
              state: { ...state, cardId: other },
            }
          : scheduled,
      );
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function start(onClose = vi.fn()) {
  const user = userEvent.setup();
  render(<ReviewQueue deckId={id} onClose={onClose} />);
  await screen.findByRole('button', { name: 'Mostrar resposta' });
  return user;
}
it('scopes the queue to a subject and retries a failed read', async () => {
  queueError = true;
  const user = userEvent.setup();
  render(<ReviewQueue subjectId={id} onClose={vi.fn()} />);
  await screen.findByRole('alert');
  queueError = false;
  await user.click(screen.getByRole('button', { name: 'Recarregar fila' }));
  await screen.findByText('Pergunta inicial');
  expect(reads).toContain(
    `/flashcard-decks/reviews/pending?page=1&pageSize=1&subjectId=${id}`,
  );
  expect(reads.at(-1)).toContain(`/review?subjectId=${id}`);
});
it('reveals by keyboard and associates each rating with its interval without writing', async () => {
  const close = vi.fn();
  const user = await start(close);
  expect(screen.queryByRole('button', { name: 'Bom' })).toBeNull();
  expect(screen.queryByText('Resposta secreta')).toBeNull();
  expect(document.activeElement?.textContent).toBe('Revisão');
  await user.tab();
  await user.tab();
  expect(document.activeElement?.textContent).toBe('Mostrar resposta');
  await user.keyboard('{Enter}');
  expect(document.activeElement?.textContent).toContain('Resposta secreta');
  for (const [rating, interval] of [
    ['De novo', '10 min'],
    ['Difícil', '1 dia'],
    ['Bom', '3 dias'],
    ['Fácil', '5 dias'],
  ] as const) {
    const button = screen.getByRole('button', { name: rating });
    expect(
      document.getElementById(button.getAttribute('aria-describedby')!)
        ?.textContent,
    ).toBe(interval);
  }
  await user.click(screen.getByRole('button', { name: 'Voltar ao resumo' }));
  expect(close).toHaveBeenCalledOnce();
  expect(writes).toHaveLength(0);
});
it('announces the confirmed date and advances in the same scope with the answer hidden', async () => {
  const user = await start();
  await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }));
  await user.dblClick(screen.getByRole('button', { name: 'Bom' }));
  await screen.findByText('Pergunta seguinte');
  expect(screen.getByText(/Avaliação registrada/).textContent).toContain(
    new Date(event.dueAt).toLocaleString(),
  );
  expect(writes).toEqual([
    { rating: 'GOOD', expectedRevision: 1, idempotencyKey: expect.any(String) },
  ]);
  expect(reads.filter((url) => url.includes('/pending'))).toEqual(
    Array(2).fill(
      `/flashcard-decks/reviews/pending?page=1&pageSize=1&deckId=${id}`,
    ),
  );
  expect(screen.queryByText('Resposta secreta')).toBeNull();
  expect(screen.getByRole('button', { name: 'Mostrar resposta' })).toBeTruthy();
  empty = true;
  await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }));
  await user.click(screen.getByRole('button', { name: 'Bom' }));
  await screen.findByText(/Sessão concluída/);
});
it('retries an uncertain confirmation with the identical payload and prevents a changed rating', async () => {
  postError = 'network';
  const user = await start();
  await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }));
  await user.click(screen.getByRole('button', { name: 'Bom' }));
  await screen.findByRole('alert');
  expect(
    (screen.getByRole('button', { name: 'Fácil' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  postError = '';
  await user.click(screen.getByRole('button', { name: 'Bom' }));
  await screen.findByText(/Avaliação registrada/);
  expect(writes).toHaveLength(2);
  expect(writes[0]).toEqual(writes[1]);
});
it('stops rating on a revision conflict and reloads before continuing', async () => {
  postError = 'conflict';
  const user = await start();
  await user.click(screen.getByRole('button', { name: 'Mostrar resposta' }));
  await user.click(screen.getByRole('button', { name: 'Bom' }));
  await screen.findByText(/O cartão foi atualizado/);
  expect(
    (screen.getByRole('button', { name: 'Bom' }) as HTMLButtonElement).disabled,
  ).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Recarregar fila' }));
  await screen.findByRole('button', { name: 'Mostrar resposta' });
  expect(writes).toHaveLength(1);
});
it('loads paginated immutable history, handles errors/empty and returns focus to its trigger', async () => {
  const user = await start();
  historyError = true;
  await user.click(screen.getByRole('button', { name: 'Ver histórico' }));
  const panel = within(
    screen.getByRole('region', { name: 'Histórico de revisões' }),
  );
  await panel.findByRole('alert');
  historyError = false;
  await user.click(panel.getByRole('button', { name: 'Tentar novamente' }));
  await panel.findByText('GOOD');
  expect(panel.getByText(/Política:/).textContent).toContain('sm2-inspired-v1');
  await user.click(panel.getByRole('button', { name: 'Próxima' }));
  await panel.findByText('AGAIN');
  empty = true;
  await user.click(panel.getByRole('button', { name: 'Anterior' }));
  await panel.findByText('Nenhuma avaliação registrada.');
  await user.click(panel.getByRole('button', { name: 'Fechar histórico' }));
  expect(document.activeElement?.textContent).toBe('Ver histórico');
  expect(writes).toHaveLength(0);
});
