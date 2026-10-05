import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { StudySubject } from '@study-platform/contracts';
import { SubjectsPage } from './SubjectsPage.js';
import { SubjectSelect } from './SubjectSelect.js';
import { App } from '../../app/App.js';
const id = '00000000-0000-4000-8000-000000000001';
const base: StudySubject = {
  id,
  name: 'Álgebra',
  currentLevel: 'BEGINNER',
  objective: 'Aprender',
  dueDate: '2026-10-01',
  weeklyHours: 1.5,
  knownTopics: [],
  planItems: [],
  createdAt: '2026-09-26T12:00:00Z',
  updatedAt: '2026-09-26T12:00:00Z',
};
let items: StudySubject[];
let failed: string;
let enabled: boolean;
let listTotal: number | null;
let pendingList: Promise<Response> | null;
const calls: Array<{
  path: string;
  method: string;
  body: Record<string, unknown>;
}> = [];
it('opens the own subject selected by a dashboard link', async () => {
  items = [base];
  window.history.replaceState({}, '', `/app/materias?subject=${id}`);
  render(<SubjectsPage />);
  await waitFor(() =>
    expect(document.activeElement?.textContent).toBe('Álgebra'),
  );
  expect(
    calls.some(
      (call) => call.path === `/subjects/${id}` && call.method === 'GET',
    ),
  ).toBe(true);
});
beforeEach(() => {
  items = [];
  failed = '';
  enabled = true;
  listTotal = null;
  pendingList = null;
  calls.length = 0;
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const path = url.pathname;
      const method = init?.method ?? 'GET';
      const body = JSON.parse(
        typeof init?.body === 'string' ? init.body : '{}',
      );
      calls.push({ path, method, body });
      if (path === `/subjects/${id}/roadmaps` && method === 'GET')
        return Response.json({
          items: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        });
      if (failed === method) throw new Error('network');
      if (path === '/auth/me')
        return Response.json({
          user: { id, email: 'ana@example.com', googleLinked: true },
        });
      if (path === '/profile/preferences')
        return Response.json({
          tasks: true,
          subjects: enabled,
          flashcards: false,
          ai: false,
        });
      if (path === '/subjects' && method === 'GET') {
        if (pendingList) return pendingList;
        return Response.json({
          items,
          total: listTotal ?? items.length,
          page: 1,
          pageSize: Number(url.searchParams.get('pageSize') ?? 20),
          totalPages: Math.ceil((listTotal ?? items.length) / 20),
        });
      }
      if (path === '/subjects' && method === 'POST') {
        const row = { ...base, ...body };
        items.push(row);
        return Response.json(row, { status: 201 });
      }
      if (path === `/subjects/${id}`) {
        if (method === 'DELETE') {
          items = [];
          return new Response(null, { status: 204 });
        }
        if (method === 'PATCH') items[0] = { ...items[0]!, ...body };
        return Response.json(items[0]);
      }
      if (path.startsWith(`/subjects/${id}/plan-items`)) {
        const row = items[0]!;
        if (method === 'POST')
          row.planItems.push({
            id: `00000000-0000-4000-8000-${String(row.planItems.length + 2).padStart(12, '0')}`,
            subjectId: id,
            title: body.title,
            status: 'PENDING',
            position: row.planItems.length,
            createdAt: base.createdAt,
            updatedAt: base.updatedAt,
          });
        if (method === 'PUT')
          row.planItems = (body.ids as string[]).map((itemId, position) => ({
            ...row.planItems.find((item) => item.id === itemId)!,
            position,
          }));
        if (method === 'PATCH') {
          const item = row.planItems.find((item) => path.endsWith(item.id))!;
          Object.assign(item, body);
        }
        if (method === 'DELETE')
          row.planItems = row.planItems
            .filter((item) => !path.endsWith(item.id))
            .map((item, position) => ({ ...item, position }));
        return Response.json(row);
      }
      if (path === '/pomodoro/sessions')
        return Response.json({
          items: [],
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0,
        });
      if (path === '/tasks')
        return Response.json({
          items: [],
          page: 1,
          pageSize: 100,
          total: 0,
          totalPages: 0,
        });
      throw new Error(`Unexpected ${path}`);
    }),
  );
});
afterEach(() => {
  window.history.replaceState({}, '', '/');
  cleanup();
  vi.unstubAllGlobals();
});
async function openDetail() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Ver Álgebra' }),
  );
  return screen.findByRole('region', { name: 'Plano manual' });
}
it('waits for the actual subject response before offering the first creation', async () => {
  let resolve!: (response: Response) => void;
  pendingList = new Promise((done) => {
    resolve = done;
  });
  render(<SubjectsPage />);
  expect(screen.getByText('Carregando matérias…')).toBeTruthy();
  expect(
    screen.queryByRole('heading', { name: 'Nenhuma matéria ainda' }),
  ).toBeNull();
  await act(async () => {
    resolve(
      Response.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      }),
    );
  });
  expect(
    await screen.findByRole('heading', { name: 'Nenhuma matéria ainda' }),
  ).toBeTruthy();
  expect(
    screen.getByText(
      'Adicione sua primeira matéria para começar a organizar seus estudos.',
    ),
  ).toBeTruthy();
  expect(calls.filter((call) => call.path === '/subjects')).toHaveLength(1);
});
it('does not claim a subject collection is empty when only its page is empty', async () => {
  listTotal = 21;
  render(<SubjectsPage />);
  await screen.findByText('Página 1 de 2');
  expect(
    screen.queryByRole('heading', { name: 'Nenhuma matéria ainda' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Adicionar matéria' }),
  ).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Próxima' }).matches(':disabled'),
  ).toBe(false);
});
it('opens the existing subject form from the empty CTA and restores focus on cancel', async () => {
  render(<SubjectsPage />);
  const interaction = userEvent.setup();
  (await screen.findByRole('button', { name: 'Adicionar matéria' })).focus();
  await interaction.keyboard('{Enter}');
  expect(document.activeElement).toBe(screen.getByLabelText('Nome'));
  expect(screen.getByRole('form', { name: 'Criar matéria' })).toBeTruthy();
  await interaction.click(
    screen.getByRole('button', { name: 'Cancelar edição' }),
  );
  expect(screen.queryByRole('form', { name: 'Criar matéria' })).toBeNull();
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Criar matéria' }),
  );
  expect(calls.some((call) => call.method === 'POST')).toBe(false);
});
it('creates from keyboard, retains form on failure and distinguishes loading, empty and success', async () => {
  const interaction = userEvent.setup();
  render(<SubjectsPage />);
  expect(screen.getByText('Carregando matérias…')).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Adicionar matéria' }),
  ).toBeNull();
  await screen.findByText(/Nenhuma matéria ainda/);
  screen.getByRole('button', { name: 'Adicionar matéria' }).focus();
  await interaction.keyboard('{Enter}');
  const form = screen.getByRole('form', { name: 'Criar matéria' });
  await interaction.type(within(form).getByLabelText('Nome'), 'Álgebra');
  await interaction.type(within(form).getByLabelText('Objetivo'), 'Aprender');
  fireEvent.change(within(form).getByLabelText('Prazo'), {
    target: { value: '2026-10-01' },
  });
  fireEvent.change(within(form).getByLabelText('Horas por semana'), {
    target: { value: '1.5' },
  });
  failed = 'POST';
  await interaction.click(
    within(form).getByRole('button', { name: 'Salvar matéria' }),
  );
  await screen.findByText(/Não foi possível concluir/);
  expect((within(form).getByLabelText('Nome') as HTMLInputElement).value).toBe(
    'Álgebra',
  );
  failed = '';
  within(form).getByRole('button', { name: 'Salvar matéria' }).focus();
  await interaction.keyboard('{Enter}');
  await screen.findByText('Matéria salva.');
  await screen.findByRole('button', { name: 'Ver Álgebra' });
  expect(
    screen.queryByRole('button', { name: 'Adicionar matéria' }),
  ).toBeNull();
  expect(items[0]).toMatchObject({
    name: 'Álgebra',
    weeklyHours: 1.5,
    knownTopics: [],
  });
});
it('persists manual order and status by keyboard with AI disabled, edits and confirms deletion', async () => {
  items = [structuredClone(base)];
  window.history.replaceState({}, '', '/app/materias');
  const interaction = userEvent.setup();
  const view = render(<App />);
  const plan = await openDetail();
  for (const title of ['Primeiro', 'Segundo']) {
    await interaction.type(
      within(plan).getByLabelText('Assunto a estudar'),
      title,
    );
    await interaction.click(
      within(plan).getByRole('button', { name: 'Adicionar assunto' }),
    );
    await waitFor(() =>
      expect(
        within(plan)
          .getByRole('button', { name: 'Adicionar assunto' })
          .hasAttribute('disabled'),
      ).toBe(false),
    );
  }
  within(plan).getByRole('button', { name: 'Subir Segundo' }).focus();
  await interaction.keyboard('{Enter}');
  await waitFor(() => expect(items[0]!.planItems[0]!.title).toBe('Segundo'));
  await interaction.selectOptions(
    within(plan).getByLabelText('Status de Segundo'),
    'COMPLETED',
  );
  await waitFor(() => expect(items[0]!.planItems[0]!.status).toBe('COMPLETED'));
  view.unmount();
  render(<App />);
  const reloaded = await openDetail();
  expect(
    within(reloaded)
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent),
  ).toEqual(['Segundo', 'Primeiro']);
  expect(
    (within(reloaded).getByLabelText('Status de Segundo') as HTMLSelectElement)
      .value,
  ).toBe('COMPLETED');
  await interaction.click(
    screen.getByRole('button', { name: 'Editar matéria' }),
  );
  await interaction.clear(screen.getByLabelText('Objetivo'));
  await interaction.type(screen.getByLabelText('Objetivo'), 'Novo objetivo');
  await interaction.click(
    screen.getByRole('button', { name: 'Salvar matéria' }),
  );
  await screen.findByText('Novo objetivo');
  await interaction.click(
    screen.getByRole('button', { name: 'Excluir matéria' }),
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Cancelar exclusão' }),
  );
  expect(items).toHaveLength(1);
  await interaction.click(
    screen.getByRole('button', { name: 'Excluir matéria' }),
  );
  failed = 'DELETE';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar exclusão' }),
  );
  await screen.findByText(/Não foi possível concluir/);
  expect(items).toHaveLength(1);
  failed = '';
  await interaction.click(
    screen.getByRole('button', { name: 'Confirmar exclusão' }),
  );
  await screen.findByText('Matéria excluída.');
  expect(items).toHaveLength(0);
  expect(
    calls.some((call) => /roadmap-generations|confirm-ai/i.test(call.path)),
  ).toBe(false);
});
it('guards direct routes, hides navigation while disabled and restores data after reactivation', async () => {
  items = [structuredClone(base)];
  enabled = false;
  window.history.replaceState({}, '', '/app/materias');
  const view = render(<App />);
  await screen.findByText(/Este módulo está desativado/);
  expect(screen.queryByRole('link', { name: 'Matérias' })).toBeNull();
  expect(calls.some((call) => call.path === '/subjects')).toBe(false);
  enabled = true;
  fireEvent(window, new Event('edutrack:preferences'));
  await screen.findByRole('button', { name: 'Ver Álgebra' });
  expect(
    screen.getByRole('link', { name: 'Matérias' }).getAttribute('href'),
  ).toBe('/app/materias');
  view.unmount();
});
it('reports list/selector failure with retry and selects an optional own subject', async () => {
  failed = 'GET';
  render(<SubjectsPage />);
  await screen.findByText(/Não foi possível concluir/);
  expect(
    screen.queryByRole('button', { name: 'Adicionar matéria' }),
  ).toBeNull();
  failed = '';
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  );
  await screen.findByText(/Nenhuma matéria ainda/);
  cleanup();
  items = [structuredClone(base)];
  const changed = vi.fn();
  render(<SubjectSelect value="" onChange={changed} />);
  await waitFor(() =>
    expect(
      (screen.getByLabelText('Matéria (opcional)') as HTMLSelectElement)
        .disabled,
    ).toBe(false),
  );
  await userEvent.selectOptions(
    screen.getByLabelText('Matéria (opcional)'),
    id,
  );
  expect(changed).toHaveBeenCalledWith(id);
});
