import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
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
async function start() {
  const user = userEvent.setup();
  render(<ReviewQueue deckId={id} onClose={vi.fn()} />);
  await user.click(
    await screen.findByRole('button', { name: 'Revisar cartão' }),
  );
  await screen.findByRole('button', { name: 'Revelar resposta' });
  return user;
}
it('loads an ordered queue without answers, supports page/filter, error retry and empty state', async () => {
  queueError = true;
  const user = userEvent.setup();
  render(<ReviewQueue deckId={id} onClose={vi.fn()} />);
  expect(screen.getByText('Carregando pendências…')).toBeTruthy();
  await screen.findByRole('alert');
  queueError = false;
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText('Pergunta inicial');
  expect(screen.queryByText('Resposta secreta')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Próxima' }));
  await screen.findByText('Pergunta seguinte');
  await user.selectOptions(screen.getByLabelText('Filtrar revisões'), id);
  await screen.findByText('Pergunta inicial');
  expect(reads.at(-1)).toContain(`page=1&pageSize=20&deckId=${id}`);
  empty = true;
  await user.selectOptions(screen.getByLabelText('Filtrar revisões'), '');
  await screen.findByText('Nenhuma revisão pendente agora.');
});
it('requires revealing before rating and exits without a write, preserving keyboard focus', async () => {
  const user = await start();
  expect(screen.queryByRole('button', { name: 'Bom (GOOD)' })).toBeNull();
  expect(screen.queryByText('Resposta secreta')).toBeNull();
  expect(document.activeElement?.textContent).toBe('Frente');
  await user.tab();
  expect(document.activeElement?.textContent).toBe('Revelar resposta');
  await user.keyboard('{Enter}');
  expect(screen.getByText('Resposta secreta')).toBeTruthy();
  for (const rating of [
    'De novo (AGAIN)',
    'Difícil (HARD)',
    'Bom (GOOD)',
    'Fácil (EASY)',
  ])
    expect(screen.getByRole('button', { name: rating })).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Sair da sessão' }));
  expect(writes).toHaveLength(0);
  expect(document.activeElement?.textContent).toBe('Revisões pendentes');
});
it('shows the next local date, reloads the queue, advances with the answer hidden and sends once', async () => {
  const user = await start();
  await user.click(screen.getByRole('button', { name: 'Revelar resposta' }));
  await user.dblClick(screen.getByRole('button', { name: 'Bom (GOOD)' }));
  await screen.findByText(/Avaliação registrada/);
  expect(screen.getByText(/Avaliação registrada/).textContent).toContain(
    new Date(event.dueAt).toLocaleString(),
  );
  expect(writes).toHaveLength(1);
  expect(writes[0]).toEqual({
    rating: 'GOOD',
    expectedRevision: 1,
    idempotencyKey: expect.any(String),
  });
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Próximo cartão',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false),
  );
  await user.click(screen.getByRole('button', { name: 'Próximo cartão' }));
  await screen.findByText('Pergunta seguinte');
  expect(screen.queryByText('Resposta secreta')).toBeNull();
  expect(screen.getByRole('button', { name: 'Revelar resposta' })).toBeTruthy();
});
it('retries an uncertain confirmation with the identical payload and prevents a changed rating', async () => {
  postError = 'network';
  const user = await start();
  await user.click(screen.getByRole('button', { name: 'Revelar resposta' }));
  await user.click(screen.getByRole('button', { name: 'Bom (GOOD)' }));
  await screen.findByRole('alert');
  expect(
    (screen.getByRole('button', { name: 'Fácil (EASY)' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  postError = '';
  await user.click(screen.getByRole('button', { name: 'Bom (GOOD)' }));
  await screen.findByText(/Avaliação registrada/);
  expect(writes).toHaveLength(2);
  expect(writes[0]).toEqual(writes[1]);
});
it('stops rating on a revision conflict and reloads before continuing', async () => {
  postError = 'conflict';
  const user = await start();
  await user.click(screen.getByRole('button', { name: 'Revelar resposta' }));
  await user.click(screen.getByRole('button', { name: 'Bom (GOOD)' }));
  await screen.findByText(/O cartão foi atualizado/);
  expect(
    (screen.getByRole('button', { name: 'Bom (GOOD)' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Recarregar fila' }));
  await screen.findByRole('button', { name: 'Revisar cartão' });
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
