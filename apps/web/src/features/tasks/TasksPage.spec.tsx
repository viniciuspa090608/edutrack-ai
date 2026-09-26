import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { StudyTask } from '@study-platform/contracts';
import { App } from '../../app/App.js';
import { TasksPage } from './TasksPage.js';

const originalTask: StudyTask = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Revisar álgebra',
  description: 'Capítulo 1',
  priority: 'HIGH',
  status: 'PENDING',
  dueDate: '2026-10-01',
  createdAt: '2026-09-26T12:00:00.000Z',
  updatedAt: '2026-09-26T12:00:00.000Z',
  subtaskTotal: 0,
  subtaskCompleted: 0,
  progressPercent: null,
};
let items: StudyTask[];
let failed: string;
let listTotal: number | null;
let pendingSave: Promise<Response> | null;
const requests: Array<{
  url: URL;
  method: string;
  body: Record<string, unknown>;
}> = [];
// jsdom does not implement native dialog methods; browser focus trapping is checked in the visual review.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
    this.querySelector<HTMLButtonElement>('button')?.focus();
  },
});
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  value: function (this: HTMLDialogElement) {
    this.removeAttribute('open');
  },
});
beforeEach(() => {
  items = [];
  failed = '';
  listTotal = null;
  pendingSave = null;
  requests.length = 0;
  window.history.replaceState({}, '', '/app/tarefas');
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const method = init?.method ?? 'GET';
      const body = JSON.parse(
        typeof init?.body === 'string' ? init.body : '{}',
      ) as Record<string, unknown>;
      requests.push({ url, method, body });
      if (failed === method) throw new Error('network');
      if (url.pathname === '/auth/me')
        return failed === 'AUTH'
          ? Response.json(
              { error: { code: 'UNAUTHENTICATED' } },
              { status: 401 },
            )
          : Response.json({
              user: {
                id: originalTask.id,
                email: 'ana@example.com',
                googleLinked: true,
              },
            });
      if (url.pathname === '/profile/preferences')
        return Response.json({
          tasks: true,
          subjects: true,
          flashcards: true,
          ai: false,
        });
      if (method === 'GET' && url.pathname === '/tasks') {
        const filtered = items.filter(
          (task) =>
            !url.searchParams.get('status') ||
            task.status === url.searchParams.get('status'),
        );
        const page = Number(url.searchParams.get('page'));
        const total = listTotal ?? filtered.length;
        return Response.json({
          items: filtered,
          page,
          pageSize: 20,
          total,
          totalPages: Math.ceil(total / 20),
        });
      }
      if (method === 'GET' && url.pathname.endsWith('/subtasks'))
        return Response.json({ items: [], task: items[0] });
      if (method === 'GET') return Response.json(items[0]);
      if (method === 'POST' || method === 'PATCH') {
        if (pendingSave) return pendingSave;
        const task = { ...originalTask, ...body } as StudyTask;
        items = [task];
        return Response.json(task, { status: method === 'POST' ? 201 : 200 });
      }
      items = [];
      return new Response(null, { status: 204 });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function openDetail() {
  await userEvent.setup().click(
    await screen.findByRole('button', {
      name: 'Ver detalhes de Revisar álgebra',
    }),
  );
  return screen.findByRole('region', { name: 'Revisar álgebra' });
}

it('protects direct access and preserves the internal login destination', async () => {
  failed = 'AUTH';
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await screen.findByRole('heading', { name: 'Entre na sua conta' });
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(
    '/app/tarefas',
  );
  expect(requests.some((r) => r.url.pathname.startsWith('/tasks'))).toBe(false);
});
it('loads behind session/preferences and offers the first task action', async () => {
  render(<App />);
  expect(screen.getByText('Verificando sessão…')).toBeTruthy();
  expect(await screen.findByText(/Você ainda não tem tarefas/)).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'Tarefas' }).getAttribute('href'),
  ).toBe('/app/tarefas');
});
it('keeps combined filters when paging, resets to page one and clears empty results', async () => {
  items = [originalTask];
  listTotal = 41;
  render(<TasksPage />);
  await screen.findByRole('button', { name: /Ver detalhes/ });
  const interaction = userEvent.setup();
  await interaction.selectOptions(
    screen.getByLabelText('Filtrar por status'),
    'PENDING',
  );
  await interaction.selectOptions(
    screen.getByLabelText('Filtrar por importância'),
    'HIGH',
  );
  fireEvent.change(screen.getByLabelText('Prazo de'), {
    target: { value: '2026-10-01' },
  });
  fireEvent.change(screen.getByLabelText('Prazo até'), {
    target: { value: '2026-10-30' },
  });
  await interaction.click(
    screen.getByRole('button', { name: 'Aplicar filtros' }),
  );
  await screen.findByText(/Página 1 de 3/);
  await interaction.click(
    screen.getByRole('button', { name: 'Próxima página' }),
  );
  await screen.findByText(/Página 2 de 3/);
  const query = requests.filter((r) => r.url.pathname === '/tasks').at(-1)!.url
    .searchParams;
  expect(Object.fromEntries(query)).toMatchObject({
    status: 'PENDING',
    priority: 'HIGH',
    dueFrom: '2026-10-01',
    dueTo: '2026-10-30',
    page: '2',
  });
  await interaction.selectOptions(
    screen.getByLabelText('Filtrar por status'),
    'COMPLETED',
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Aplicar filtros' }),
  );
  await screen.findByText(/Nenhum resultado/);
  expect(requests.at(-1)!.url.searchParams.get('page')).toBe('1');
  await interaction.click(
    screen.getByRole('button', { name: 'Limpar filtros' }),
  );
  await screen.findByRole('button', { name: /Ver detalhes/ });
  expect(requests.at(-1)!.url.searchParams.has('status')).toBe(false);
});
it('rejects an inverted calendar range and recovers from a list network error', async () => {
  failed = 'GET';
  render(<TasksPage />);
  await screen.findByRole('alert');
  failed = '';
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText(/Você ainda não tem tarefas/);
  fireEvent.change(screen.getByLabelText('Prazo de'), {
    target: { value: '2026-10-30' },
  });
  fireEvent.change(screen.getByLabelText('Prazo até'), {
    target: { value: '2026-10-01' },
  });
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Aplicar filtros' }));
  expect((await screen.findByRole('alert')).textContent).toContain(
    'prazo final',
  );
  expect(requests.filter((r) => r.url.pathname === '/tasks')).toHaveLength(2);
});
it('creates using keyboard/defaults, validates whitespace and retains input after failure', async () => {
  render(<TasksPage />);
  await screen.findByText(/Você ainda não tem tarefas/);
  const interaction = userEvent.setup();
  screen.getByRole('button', { name: 'Criar tarefa' }).focus();
  await interaction.keyboard('{Enter}');
  const title = screen.getByLabelText('Título');
  expect(document.activeElement).toBe(title);
  expect(
    (screen.getByLabelText('Importância') as HTMLSelectElement).value,
  ).toBe('MEDIUM');
  expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe(
    'PENDING',
  );
  await interaction.type(title, '   ');
  await interaction.keyboard('{Enter}');
  await screen.findByText('Informe um título de 1 a 160 caracteres.');
  expect(title.getAttribute('aria-invalid')).toBe('true');
  expect(document.activeElement).toBe(title);
  expect(requests.some((r) => r.method === 'POST')).toBe(false);
  await interaction.clear(title);
  await interaction.type(title, 'Revisar álgebra');
  failed = 'POST';
  await interaction.keyboard('{Enter}');
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Tente novamente',
  );
  expect((title as HTMLInputElement).value).toBe('Revisar álgebra');
  failed = '';
  await interaction.keyboard('{Enter}');
  await screen.findByText('Tarefa salva.');
  expect(requests.filter((r) => r.method === 'POST').at(-1)!.body).toEqual({
    title: 'Revisar álgebra',
    description: null,
    dueDate: null,
    priority: 'MEDIUM',
    status: 'PENDING',
  });
});
it('blocks duplicate saves while pending', async () => {
  let resolve!: (res: Response) => void;
  pendingSave = new Promise((done) => {
    resolve = done;
  });
  render(<TasksPage />);
  await screen.findByText(/Você ainda não tem tarefas/);
  const interaction = userEvent.setup();
  await interaction.click(screen.getByRole('button', { name: 'Criar tarefa' }));
  await interaction.type(screen.getByLabelText('Título'), 'Revisar álgebra');
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar tarefa' }),
  );
  expect(
    screen.getByRole('button', { name: 'Salvando…' }).matches(':disabled'),
  ).toBe(true);
  fireEvent.submit(screen.getByRole('form', { name: 'Criar tarefa' }));
  expect(requests.filter((r) => r.method === 'POST')).toHaveLength(1);
  await act(async () => {
    resolve(Response.json(originalTask));
  });
  await screen.findByText('Tarefa salva.');
});
it('shows detail, clears optional fields and manually changes all three statuses', async () => {
  items = [originalTask];
  render(<TasksPage />);
  let detail = await openDetail();
  expect(within(detail).getByText('01/10/2026')).toBeTruthy();
  expect(within(detail).getByText('Capítulo 1')).toBeTruthy();
  const interaction = userEvent.setup();
  for (const status of ['IN_PROGRESS', 'COMPLETED', 'PENDING']) {
    await interaction.click(
      within(detail).getByRole('button', { name: 'Editar tarefa' }),
    );
    await interaction.clear(screen.getByLabelText('Descrição (opcional)'));
    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), {
      target: { value: '' },
    });
    await interaction.selectOptions(screen.getByLabelText('Status'), status);
    await interaction.click(
      screen.getByRole('button', { name: 'Salvar tarefa' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('form', { name: 'Editar tarefa' })).toBeNull(),
    );
    detail = screen.getByRole('region', { name: 'Revisar álgebra' });
    expect(
      requests.filter((r) => r.method === 'PATCH').at(-1)!.body,
    ).toMatchObject({ status, description: null, dueDate: null });
  }
});
it('cancels deletion, keeps records on failure, then confirms deletion by keyboard', async () => {
  items = [originalTask];
  render(<TasksPage />);
  const detail = await openDetail();
  const interaction = userEvent.setup();
  await interaction.click(
    within(detail).getByRole('button', { name: 'Excluir tarefa' }),
  );
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Cancelar exclusão' }),
  );
  await interaction.keyboard('{Enter}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(items).toHaveLength(1);
  await interaction.click(
    within(detail).getByRole('button', { name: 'Excluir tarefa' }),
  );
  failed = 'DELETE';
  await interaction.tab();
  await interaction.keyboard('{Enter}');
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Tente novamente',
  );
  expect(items).toHaveLength(1);
  failed = '';
  screen.getByRole('button', { name: 'Confirmar exclusão' }).focus();
  await interaction.keyboard('{Enter}');
  await screen.findByText('Tarefa excluída.');
  expect(screen.queryByRole('dialog')).toBeNull();
  await screen.findByText(/Você ainda não tem tarefas/);
  expect(items).toHaveLength(0);
});
