import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { FlashcardDeck, Flashcard } from '@study-platform/contracts';
import { FlashcardsPage } from './FlashcardsPage.js';
import { DeckForm } from './FlashcardForms.js';
import { App } from '../../app/App.js';
const id = '00000000-0000-4000-8000-000000000001';
const id2 = '00000000-0000-4000-8000-000000000002';
const stamps = {
  createdAt: '2026-09-26T12:00:00Z',
  updatedAt: '2026-09-26T12:00:00Z',
};
const base: FlashcardDeck = {
  id,
  name: 'Álgebra',
  description: null,
  subjectId: null,
  ...stamps,
};
let decks: FlashcardDeck[],
  cards: Flashcard[],
  failed: string,
  enabled: boolean;
let aiEnabled: boolean;
const calls: Array<{
  path: string;
  method: string;
  body: Record<string, unknown>;
}> = [];
beforeEach(() => {
  decks = [{ ...base }];
  cards = [
    {
      id,
      deckId: id,
      front: 'Pergunta 1',
      back: 'Resposta secreta 1',
      ...stamps,
    },
    {
      id: id2,
      deckId: id,
      front: 'Pergunta 2',
      back: 'Resposta secreta 2',
      ...stamps,
    },
  ];
  failed = '';
  enabled = true;
  aiEnabled = false;
  calls.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input),
        path = url.pathname,
        method = init?.method ?? 'GET';
      const body = JSON.parse(
        typeof init?.body === 'string' ? init.body : '{}',
      );
      calls.push({ path, method, body });
      if (failed === method) throw new Error('network');
      if (path === '/auth/me')
        return Response.json({
          user: { id, email: 'ana@example.com', googleLinked: true },
        });
      if (path === '/profile/preferences')
        return Response.json({
          tasks: true,
          subjects: false,
          flashcards: enabled,
          ai: aiEnabled,
        });
      const list = (items: unknown[]) => {
        const page = Number(url.searchParams.get('page') ?? 1),
          pageSize = Number(url.searchParams.get('pageSize') ?? 20);
        return Response.json({
          items: items.slice((page - 1) * pageSize, page * pageSize),
          page: Number(url.searchParams.get('page') ?? 1),
          pageSize: Number(url.searchParams.get('pageSize') ?? 20),
          total: items.length,
          totalPages: Math.ceil(items.length / pageSize),
        });
      };
      const subject = {
        id: id2,
        name: 'Matéria própria',
        currentLevel: 'BEGINNER',
        objective: 'Aprender',
        dueDate: '2026-10-01',
        weeklyHours: 1,
        knownTopics: [],
        planItems: [],
        ...stamps,
      };
      if (path === '/subjects') return list([subject]);
      if (path === `/subjects/${id2}`) return Response.json(subject);
      if (path === '/flashcard-decks') {
        if (method === 'GET') return list(decks);
        const deck = { ...base, ...body } as FlashcardDeck;
        decks.push(deck);
        return Response.json(deck, { status: 201 });
      }
      if (path === `/flashcard-decks/${id}`) {
        if (method === 'PATCH') Object.assign(decks[0]!, body);
        if (method === 'DELETE') {
          decks = [];
          cards = [];
          return new Response(null, { status: 204 });
        }
        return Response.json(decks[0]);
      }
      if (path === `/flashcard-decks/${id}/cards`) {
        if (method === 'GET')
          return list(
            cards.map(({ back, ...summary }) => {
              void back;
              return summary;
            }),
          );
        const card = { id: id2, deckId: id, ...stamps, ...body } as Flashcard;
        cards.push(card);
        return Response.json(card, { status: 201 });
      }
      const card = cards.find((item) => path.endsWith(`/cards/${item.id}`));
      if (card) {
        if (method === 'PATCH') Object.assign(card, body);
        if (method === 'DELETE') {
          cards = cards.filter((item) => item.id !== card.id);
          return new Response(null, { status: 204 });
        }
        return Response.json(card);
      }
      throw new Error(`Unexpected ${path}`);
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function openDeck() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Abrir Álgebra' }),
  );
  await screen.findByText('Pergunta 1');
}
it('offers AI only when enabled, keeping manual and import actions available on direct navigation', async () => {
  const user = userEvent.setup();
  const view = render(
    <FlashcardsPage subjectsEnabled={false} aiEnabled={false} />,
  );
  expect(screen.queryByRole('button', { name: 'Aprimorar com IA' })).toBeNull();
  await user.click(
    await screen.findByRole('button', { name: 'Abrir Álgebra' }),
  );
  expect(screen.getByRole('button', { name: 'Adicionar cartão' })).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Importar CSV ou TSV' }),
  ).toBeTruthy();
  view.rerender(<FlashcardsPage subjectsEnabled={false} aiEnabled />);
  await user.click(screen.getByRole('button', { name: 'Aprimorar com IA' }));
  await screen.findByLabelText('Conteúdo ou assunto');
  view.rerender(<FlashcardsPage subjectsEnabled={false} aiEnabled={false} />);
  expect(screen.queryByLabelText('Conteúdo ou assunto')).toBeNull();
  view.unmount();
  aiEnabled = true;
  window.history.replaceState(null, '', '/app/flashcards');
  render(<App />);
  expect(
    await screen.findByRole('button', { name: 'Aprimorar com IA' }),
  ).toBeTruthy();
});
it('reveals by keyboard only, resets when changing cards and never writes during consultation', async () => {
  render(<FlashcardsPage subjectsEnabled={false} />);
  await openDeck();
  await userEvent.click(
    screen.getAllByRole('button', { name: 'Abrir cartão' })[0]!,
  );
  await screen.findByRole('region', { name: 'Consulta do cartão' });
  expect(screen.queryByText('Resposta secreta 1')).toBeNull();
  const interaction = userEvent.setup();
  const button = screen.getByRole('button', { name: 'Revelar resposta' });
  button.focus();
  await interaction.keyboard('{Enter}');
  expect(screen.getByText('Resposta secreta 1')).toBeTruthy();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Mostrar frente' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Mostrar frente' }),
  );
  expect(screen.queryByText('Resposta secreta 1')).toBeNull();
  await interaction.click(
    screen.getByRole('button', { name: 'Revelar resposta' }),
  );
  await interaction.click(
    screen.getAllByRole('button', { name: 'Abrir cartão' })[1]!,
  );
  await waitFor(() =>
    expect(
      within(
        screen.getByRole('region', { name: 'Consulta do cartão' }),
      ).getByText('Pergunta 2'),
    ).toBeTruthy(),
  );
  expect(screen.queryByText('Resposta secreta 1')).toBeNull();
  expect(screen.queryByText('Resposta secreta 2')).toBeNull();
  expect(calls.every((call) => call.method === 'GET')).toBe(true);
});
it('validates fields and preserves typed card values on failure, then saves successfully', async () => {
  render(<FlashcardsPage subjectsEnabled={false} />);
  await openDeck();
  const interaction = userEvent.setup();
  await interaction.click(
    screen.getByRole('button', { name: 'Adicionar cartão' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar cartão' }),
  );
  expect(screen.getAllByRole('alert')).toHaveLength(2);
  await interaction.type(screen.getByLabelText('Frente'), 'Nova pergunta');
  await interaction.type(screen.getByLabelText('Verso'), 'Novo verso');
  failed = 'POST';
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar cartão' }),
  );
  await screen.findByText(/Não foi possível salvar o cartão/);
  expect((screen.getByLabelText('Verso') as HTMLTextAreaElement).value).toBe(
    'Novo verso',
  );
  failed = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar cartão' }),
  );
  await screen.findByText('Cartão salvo.');
  expect(
    [...calls].reverse().find((call) => call.method === 'POST')?.body,
  ).toEqual({
    front: 'Nova pergunta',
    back: 'Novo verso',
  });
});
it('confirms deletions, preserves data on cancellation/failure and describes deck cascade', async () => {
  render(<FlashcardsPage subjectsEnabled={false} />);
  await openDeck();
  const interaction = userEvent.setup();
  await interaction.click(
    screen.getAllByRole('button', { name: 'Excluir cartão' })[0]!,
  );
  await interaction.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(cards).toHaveLength(2);
  expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
  await interaction.click(
    screen.getAllByRole('button', { name: 'Excluir cartão' })[0]!,
  );
  failed = 'DELETE';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar exclusão' }),
  );
  await screen.findByText(/Os dados foram preservados/);
  expect(cards).toHaveLength(2);
  failed = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar exclusão' }),
  );
  await waitFor(() => expect(cards).toHaveLength(1));
  await screen.findByText('Exclusão concluída.');
  await interaction.click(
    await screen.findByRole('button', { name: 'Excluir Álgebra' }),
  );
  expect(
    screen.getByText('O baralho e todos os seus cartões serão removidos.'),
  ).toBeTruthy();
  await interaction.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(decks).toHaveLength(1);
  await interaction.click(
    screen.getByRole('button', { name: 'Excluir Álgebra' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar exclusão' }),
  );
  await screen.findByText(/Nenhum baralho/);
  expect(cards).toHaveLength(0);
});
it('creates without subjects, retains deck form on error, and omits preserved associations when subjects are disabled', async () => {
  const onSaved = vi.fn();
  render(
    <DeckForm
      deck={{ ...base, subjectId: id2 }}
      subjectsEnabled={false}
      onSaved={onSaved}
      onCancel={() => {}}
    />,
  );
  expect(screen.queryByRole('combobox')).toBeNull();
  const interaction = userEvent.setup();
  await interaction.clear(screen.getByLabelText('Nome'));
  await interaction.type(screen.getByLabelText('Nome'), 'Alterado');
  failed = 'PATCH';
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar baralho' }),
  );
  await screen.findByText(/Não foi possível salvar o baralho/);
  expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe(
    'Alterado',
  );
  failed = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar baralho' }),
  );
  await waitFor(() => expect(onSaved).toHaveBeenCalled());
  expect(
    [...calls].reverse().find((call) => call.method === 'PATCH')?.body,
  ).not.toHaveProperty('subjectId');
  await interaction.click(
    screen.getByRole('button', { name: 'Remover vínculo com matéria' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar baralho' }),
  );
  await waitFor(() =>
    expect(
      [...calls].reverse().find((call) => call.method === 'PATCH')?.body
        .subjectId,
    ).toBeNull(),
  );
});
it('distinguishes loading, error/retry and empty list, creating the first deck without AI', async () => {
  decks = [];
  failed = 'GET';
  render(<FlashcardsPage subjectsEnabled={false} />);
  expect(screen.getByText('Carregando baralhos…')).toBeTruthy();
  await screen.findByRole('alert');
  failed = '';
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  );
  await screen.findByText(/Nenhum baralho/);
  await userEvent.click(screen.getByRole('button', { name: 'Criar baralho' }));
  await userEvent.type(screen.getByLabelText('Nome'), 'Primeiro');
  await userEvent.click(screen.getByRole('button', { name: 'Salvar baralho' }));
  await screen.findByText('Baralho salvo.');
  expect(decks[0]?.subjectId).toBeNull();
  expect(calls.some((call) => call.path.includes('/ai'))).toBe(false);
});
it('protects direct reload and navigation, blocks disabled flashcards and rechecks preference changes', async () => {
  enabled = false;
  window.history.replaceState({}, '', '/app/flashcards');
  render(<App />);
  await screen.findByText(/Este módulo está desativado/);
  expect(calls.some((call) => call.path === '/flashcard-decks')).toBe(false);
  enabled = true;
  fireEvent(window, new Event('focus'));
  await screen.findByRole('button', { name: 'Abrir Álgebra' });
  expect(
    screen.getByRole('link', { name: 'Flashcards' }).getAttribute('href'),
  ).toBe('/app/flashcards');
  enabled = false;
  fireEvent(window, new Event('focus'));
  await screen.findByText(/Este módulo está desativado/);
  expect(screen.queryByRole('button', { name: 'Criar baralho' })).toBeNull();
});
it('edits cards without losing the front and reloads confirmed values', async () => {
  render(<FlashcardsPage subjectsEnabled={false} />);
  await openDeck();
  const interaction = userEvent.setup();
  await interaction.click(
    screen.getAllByRole('button', { name: 'Editar cartão' })[0]!,
  );
  const form = await screen.findByRole('form', { name: 'Editar cartão' });
  await interaction.clear(within(form).getByLabelText('Verso'));
  await interaction.type(
    within(form).getByLabelText('Verso'),
    'Resposta editada',
  );
  await interaction.click(
    within(form).getByRole('button', { name: 'Salvar cartão' }),
  );
  await screen.findByText('Cartão salvo.');
  expect(cards[0]).toMatchObject({
    front: 'Pergunta 1',
    back: 'Resposta editada',
  });
  await interaction.click(
    screen.getAllByRole('button', { name: 'Abrir cartão' })[0]!,
  );
  await interaction.click(
    await screen.findByRole('button', { name: 'Revelar resposta' }),
  );
  expect(screen.getByText('Resposta editada')).toBeTruthy();
});
it('associates and removes an optional own subject and shows it after page reload', async () => {
  const interaction = userEvent.setup();
  const { unmount } = render(<FlashcardsPage subjectsEnabled />);
  await interaction.click(
    await screen.findByRole('button', { name: 'Editar Álgebra' }),
  );
  const select = await screen.findByRole('combobox');
  await waitFor(() =>
    expect((select as HTMLSelectElement).disabled).toBe(false),
  );
  await interaction.selectOptions(select, id2);
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar baralho' }),
  );
  await screen.findByText('Baralho salvo.');
  expect(decks[0]?.subjectId).toBe(id2);
  unmount();
  render(<FlashcardsPage subjectsEnabled />);
  await screen.findByText('Matéria própria');
  await interaction.click(
    screen.getByRole('button', { name: 'Editar Álgebra' }),
  );
  const nextSelect = await screen.findByRole('combobox');
  await waitFor(() =>
    expect((nextSelect as HTMLSelectElement).disabled).toBe(false),
  );
  await interaction.selectOptions(nextSelect, '');
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar baralho' }),
  );
  await screen.findByText('Baralho salvo.');
  expect(decks[0]?.subjectId).toBeNull();
  expect(cards).toHaveLength(2);
});
it('paginates decks and cards, distinguishes card load failure and empty deck', async () => {
  decks = Array.from({ length: 21 }, (_, index) => ({
    ...base,
    id:
      index === 0
        ? id
        : `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    name: index === 0 ? 'Álgebra' : `Baralho ${index}`,
  }));
  cards = Array.from({ length: 21 }, (_, index) => ({
    ...cards[0]!,
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    front: `Pergunta ${index + 1}`,
  }));
  render(<FlashcardsPage subjectsEnabled={false} />);
  const interaction = userEvent.setup();
  await screen.findByRole('button', { name: 'Abrir Álgebra' });
  await interaction.click(
    within(screen.getByRole('navigation', { name: 'Baralhos' })).getByRole(
      'button',
      { name: 'Próxima' },
    ),
  );
  await screen.findByRole('button', { name: 'Abrir Baralho 20' });
  expect(screen.queryByRole('button', { name: 'Abrir Álgebra' })).toBeNull();
  await interaction.click(
    within(screen.getByRole('navigation', { name: 'Baralhos' })).getByRole(
      'button',
      { name: 'Anterior' },
    ),
  );
  await openDeck();
  await interaction.click(
    within(screen.getByRole('navigation', { name: 'Cartões' })).getByRole(
      'button',
      { name: 'Próxima' },
    ),
  );
  await screen.findByText('Pergunta 21');
  failed = 'GET';
  await interaction.click(
    within(screen.getByRole('navigation', { name: 'Cartões' })).getByRole(
      'button',
      { name: 'Anterior' },
    ),
  );
  await screen.findByText(/Não foi possível carregar cartões/);
  failed = '';
  cards = [];
  await interaction.click(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  );
  await screen.findByText(/Este baralho está vazio/);
});
