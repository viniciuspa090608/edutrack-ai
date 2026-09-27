import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FlashcardAIFlow } from './FlashcardAIFlow.js';
import type { FlashcardDeck } from '@study-platform/contracts';
const id = '00000000-0000-4000-8000-000000000001',
  other = '00000000-0000-4000-8000-000000000002',
  third = '00000000-0000-4000-8000-000000000003';
const now = '2026-09-27T12:00:00.000Z',
  stamps = { createdAt: now, updatedAt: now };
const deck: FlashcardDeck = {
  id,
  name: 'Baralho próprio',
  description: null,
  subjectId: null,
  ...stamps,
};
const generated = [
  { id, front: 'Q1', back: 'A1' },
  { id: other, front: 'Q2', back: 'A2' },
  { id: third, front: '<script>alert(1)</script>', back: '<b>Texto</b>' },
];
const preview = {
  deckId: id,
  deckName: deck.name,
  text: 'Conteúdo privado',
  generationId: third,
  expiresAt: now,
  receipt: 'proof',
  cards: generated,
};
let generationError: boolean,
  saveError: 'network' | 'invalid' | 'expired' | 'disabled' | '',
  deckError: boolean,
  empty: boolean;
const calls: Array<{
  path: string;
  method: string;
  body: Record<string, unknown>;
}> = [];
let stored: unknown;
beforeEach(() => {
  generationError = false;
  saveError = '';
  deckError = false;
  empty = false;
  stored = null;
  calls.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input),
        method = init?.method ?? 'GET';
      const body = JSON.parse(
        typeof init?.body === 'string' ? init.body : '{}',
      ) as Record<string, unknown>;
      calls.push({ path: url.pathname + url.search, method, body });
      if (method === 'GET') {
        if (deckError) throw new Error('offline');
        const page = Number(url.searchParams.get('page') ?? 1);
        return Response.json({
          items: empty
            ? []
            : [
                {
                  ...deck,
                  id: page === 2 ? other : id,
                  name: page === 2 ? 'Outro baralho' : deck.name,
                },
              ],
          page,
          pageSize: 20,
          total: empty ? 0 : 21,
          totalPages: empty ? 0 : 2,
        });
      }
      if (url.pathname.endsWith('/confirm')) {
        if (
          saveError === 'invalid' ||
          saveError === 'expired' ||
          saveError === 'disabled'
        )
          return Response.json(
            {
              error: {
                code:
                  saveError === 'invalid'
                    ? 'INVALID_INPUT'
                    : saveError === 'expired'
                      ? 'RECEIPT_EXPIRED'
                      : 'AI_DISABLED',
              },
            },
            { status: saveError === 'disabled' ? 403 : 400 },
          );
        stored ??= {
          generationId: third,
          deckId: body.deckId,
          cards: (body.cards as typeof generated).map((card) => ({
            ...card,
            deckId: body.deckId,
            ...stamps,
          })),
        };
        if (saveError === 'network') throw new Error('lost response');
        return Response.json(stored);
      }
      if (generationError) throw new Error('offline');
      return Response.json({
        ...preview,
        deckId: url.pathname.split('/')[2],
        text: body.text,
      });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function setup(initialDeck: FlashcardDeck | null = deck) {
  const user = userEvent.setup(),
    onClose = vi.fn(),
    onSaved = vi.fn();
  const view = render(
    <FlashcardAIFlow
      initialDeck={initialDeck}
      onClose={onClose}
      onSaved={onSaved}
    />,
  );
  return { user, onClose, onSaved, ...view };
}
async function generate() {
  const context = setup();
  await screen.findByLabelText('Baralho de destino');
  await context.user.type(
    screen.getByLabelText('Conteúdo ou assunto'),
    'Conteúdo privado',
  );
  await context.user.click(
    screen.getByRole('button', { name: 'Gerar prévia' }),
  );
  await screen.findByLabelText('Frente do cartão 1');
  return context;
}
it('validates source and destination, supports paginated own decks and preserves input on generation failure', async () => {
  const { user } = setup(null);
  expect(screen.getByText('Carregando baralhos…')).toBeTruthy();
  await screen.findByLabelText('Baralho de destino');
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByText('Escolha um baralho existente.');
  await user.selectOptions(screen.getByLabelText('Baralho de destino'), id);
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  expect(document.activeElement).toBe(
    screen.getByLabelText('Conteúdo ou assunto'),
  );
  expect(
    screen.getByLabelText('Conteúdo ou assunto').getAttribute('aria-invalid'),
  ).toBe('true');
  expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Próxima' }));
  await screen.findByRole('option', { name: 'Outro baralho' });
  await user.selectOptions(screen.getByLabelText('Baralho de destino'), other);
  await user.type(
    screen.getByLabelText('Conteúdo ou assunto'),
    'Conteúdo privado',
  );
  generationError = true;
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByText(/Não foi possível concluir/);
  expect(
    (screen.getByLabelText('Conteúdo ou assunto') as HTMLTextAreaElement).value,
  ).toBe('Conteúdo privado');
  generationError = false;
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByLabelText('Frente do cartão 1');
  expect(calls.filter((call) => call.method === 'POST').at(-1)?.path).toContain(
    other,
  );
});
it('shows all cards as escaped text and saves only visible edits in order without an automatic write', async () => {
  const { user, onSaved, container } = await generate();
  expect(screen.getByText('Destino: Baralho próprio')).toBeTruthy();
  expect(screen.getByText('Entrada: Conteúdo privado')).toBeTruthy();
  expect(
    (screen.getByLabelText('Frente do cartão 3') as HTMLTextAreaElement).value,
  ).toBe('<script>alert(1)</script>');
  expect(container.querySelector('script')).toBeNull();
  expect(calls.filter((call) => call.path.endsWith('/confirm'))).toHaveLength(
    0,
  );
  await user.clear(screen.getByLabelText('Verso do cartão 1'));
  await user.type(screen.getByLabelText('Verso do cartão 1'), 'Revisada');
  await user.click(screen.getByRole('button', { name: 'Remover cartão 2' }));
  await user.dblClick(screen.getByRole('button', { name: 'Salvar cartões' }));
  await screen.findByText('2 cartões salvos no baralho.');
  const confirmations = calls.filter((call) => call.path.endsWith('/confirm'));
  expect(confirmations).toHaveLength(1);
  expect(confirmations[0]!.body).toEqual({
    deckId: id,
    receipt: 'proof',
    cards: [{ ...generated[0], back: 'Revisada' }, generated[2]],
  });
  expect(onSaved).toHaveBeenCalledTimes(1);
  expect(container.querySelector('script')).toBeNull();
});
it('saves the generated list unchanged and supports cancelling/leaving with no confirmation', async () => {
  const first = await generate();
  await first.user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(first.onClose).toHaveBeenCalledOnce();
  expect(calls.filter((call) => call.path.endsWith('/confirm'))).toHaveLength(
    0,
  );
  first.unmount();
  const second = await generate();
  await second.user.click(
    screen.getByRole('button', { name: 'Salvar cartões' }),
  );
  await screen.findByText('3 cartões salvos no baralho.');
  expect(
    calls.filter((call) => call.path.endsWith('/confirm')).at(-1)?.body.cards,
  ).toEqual(generated);
});
it('refuses invalid local edits and empty lists, associating errors with the affected fields', async () => {
  const { user } = await generate();
  await user.clear(screen.getByLabelText('Verso do cartão 1'));
  await user.click(screen.getByRole('button', { name: 'Salvar cartões' }));
  expect(
    screen.getByLabelText('Verso do cartão 1').getAttribute('aria-invalid'),
  ).toBe('true');
  expect(
    screen.getByText('Preencha verso de até 4000 caracteres.'),
  ).toBeTruthy();
  expect(calls.filter((call) => call.path.endsWith('/confirm'))).toHaveLength(
    0,
  );
  for (let index = 0; index < 3; index++)
    await user.click(screen.getByRole('button', { name: 'Remover cartão 1' }));
  expect(
    (
      screen.getByRole('button', {
        name: 'Salvar cartões',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  expect(screen.getByText(/Nenhum cartão restante/)).toBeTruthy();
});
it('recovers an uncertain save using exactly the same proof and revised payload', async () => {
  const { user } = await generate();
  await user.clear(screen.getByLabelText('Verso do cartão 1'));
  await user.type(screen.getByLabelText('Verso do cartão 1'), 'Revisada');
  saveError = 'network';
  await user.click(screen.getByRole('button', { name: 'Salvar cartões' }));
  await screen.findByText(/Confirmação sem resposta/);
  expect(
    (screen.getByLabelText('Verso do cartão 1') as HTMLTextAreaElement).value,
  ).toBe('Revisada');
  expect(
    (
      screen
        .getByLabelText('Verso do cartão 1')
        .closest('fieldset') as HTMLFieldSetElement
    ).disabled,
  ).toBe(true);
  saveError = '';
  await user.click(screen.getByRole('button', { name: 'Salvar cartões' }));
  await screen.findByText('3 cartões salvos no baralho.');
  const confirmations = calls.filter((call) => call.path.endsWith('/confirm'));
  expect(confirmations).toHaveLength(2);
  expect(confirmations[0]!.body).toEqual(confirmations[1]!.body);
});
it('preserves editable fields after a known validation error, offers regeneration on expiry and preferences on denial', async () => {
  const { user } = await generate();
  saveError = 'invalid';
  await user.click(screen.getByRole('button', { name: 'Salvar cartões' }));
  await screen.findByRole('alert');
  expect(
    (screen.getByLabelText('Verso do cartão 1') as HTMLTextAreaElement)
      .disabled,
  ).toBe(false);
  await user.type(screen.getByLabelText('Verso do cartão 1'), ' editada');
  saveError = 'expired';
  await user.click(screen.getByRole('button', { name: 'Salvar cartões' }));
  await screen.findByText(/Esta prévia expirou/);
  await user.click(screen.getByRole('button', { name: 'Gerar outra prévia' }));
  expect(
    (screen.getByLabelText('Conteúdo ou assunto') as HTMLTextAreaElement).value,
  ).toBe('Conteúdo privado');
  await user.click(screen.getByRole('button', { name: 'Gerar prévia' }));
  await screen.findByLabelText('Frente do cartão 1');
  saveError = 'disabled';
  await user.click(screen.getByRole('button', { name: 'Salvar cartões' }));
  expect(
    await screen.findByRole('link', { name: 'Abrir preferências' }),
  ).toBeTruthy();
});
it('distinguishes deck load error/retry and empty state, and cancelling the source form sends no writes', async () => {
  deckError = true;
  const { user, onClose } = setup(null);
  await screen.findByRole('alert');
  deckError = false;
  empty = true;
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText('Crie um baralho antes de gerar cartões.');
  expect(
    (screen.getByRole('button', { name: 'Gerar prévia' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
});
it('can generate, review and save with keyboard focus and plain text semantics', async () => {
  const { user } = setup();
  await screen.findByLabelText('Conteúdo ou assunto');
  const source = screen.getByLabelText('Conteúdo ou assunto');
  source.focus();
  await user.type(source, 'Conteúdo privado');
  await user.tab();
  expect(document.activeElement?.textContent).toBe('Gerar prévia');
  await user.keyboard('{Enter}');
  await screen.findByLabelText('Frente do cartão 1');
  expect(document.activeElement?.textContent).toBe('Aprimorar com IA');
  screen.getByRole('button', { name: 'Salvar cartões' }).focus();
  await user.keyboard('{Enter}');
  await screen.findByText('3 cartões salvos no baralho.');
  expect(
    within(screen.getByRole('region', { name: 'Aprimorar com IA' })).getByText(
      '<b>Texto</b>',
    ),
  ).toBeTruthy();
  await waitFor(() =>
    expect(document.activeElement?.textContent).toBe('Aprimorar com IA'),
  );
});
