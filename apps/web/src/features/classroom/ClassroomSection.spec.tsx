import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ClassroomSection } from './ClassroomSection.js';
import { OnboardingGate } from './OnboardingGate.js';

const prefs = {
  tasks: true,
  subjects: false,
  flashcards: true,
  pomodoro: true,
  reports: true,
  routines: true,
  ai: false,
};
const connection = {
  available: true,
  state: 'connected',
  account: { subject: 'google-sub', email: 'student@example.test' },
  permissions: {
    courses: true,
    coursework: true,
    teacherCoursework: false,
  },
  version: 1,
};
let disconnected = false,
  offline = false;
const calls: Array<{ path: string; method: string; body: unknown }> = [];
const empty = () => ({
  added: 0,
  updated: 0,
  unchanged: 0,
  ignored: 0,
  conflict: 0,
  error: 0,
});
const result = {
  operation: {
    id: '00000000-0000-4000-8000-000000000001',
    kind: 'import',
    state: 'partial',
    phase: 'finished',
    processed: 2,
    total: 2,
    counts: {
      subjects: empty(),
      tasks: { ...empty(), added: 1, error: 1 },
    },
    message: null,
    createdAt: '2026-11-02T12:00:00Z',
    updatedAt: '2026-11-02T12:00:00Z',
  },
  items: [
    {
      id: '00000000-0000-4000-8000-000000000002',
      entity: 'task',
      externalId: 'work1',
      courseId: 'course1',
      title: 'Atividade inacessível',
      outcome: 'error',
      reason: 'Acesso negado pelo Google.',
      localId: null,
      conflictId: null,
    },
  ],
  page: 1,
  totalItems: 1,
};
let latest: typeof result | null = null;
let subjectPages = false;
let pages = false,
  pageFailure = false,
  repeatToken = false;
beforeEach(() => {
  calls.length = 0;
  disconnected = false;
  offline = false;
  latest = null;
  subjectPages = false;
  pages = false;
  pageFailure = false;
  repeatToken = false;
  window.history.replaceState({}, '', '/conta');
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, options?: RequestInit) => {
      const path = new URL(url).pathname,
        method = options?.method ?? 'GET';
      const body =
        typeof options?.body === 'string' ? JSON.parse(options.body) : null;
      calls.push({ path, method, body });
      if (offline && path.endsWith('/connection'))
        throw new Error('Conexão indisponível.');
      if (path.endsWith('/connection') && method === 'DELETE') {
        disconnected = true;
        return Response.json({ revocationConfirmed: true });
      }
      if (path.endsWith('/connection'))
        return Response.json({
          ...connection,
          ...(disconnected ? { state: 'disconnected', account: null } : {}),
        });
      if (path.endsWith('/selection'))
        return Response.json(method === 'PUT' ? body : { courses: [] });
      if (
        path.endsWith('/courses') &&
        new URL(url).searchParams.has('pageToken')
      ) {
        if (pageFailure) throw new Error('Falha ao buscar matérias.');
        return Response.json({
          items: [
            {
              id: 'course2',
              name: 'Física',
              section: null,
              link: null,
              state: 'ACTIVE',
            },
          ],
          nextPageToken: repeatToken ? 'next' : null,
        });
      }
      if (path.endsWith('/courses'))
        return Response.json({
          items: [
            {
              id: 'course1',
              name: 'Matemática',
              section: null,
              link: 'https://classroom.google.com/c/1',
              state: 'ACTIVE',
            },
          ],
          nextPageToken: pages ? 'next' : null,
        });
      if (path.endsWith('/operations')) return Response.json(latest);
      if (path === '/subjects')
        return Response.json(
          subjectPages
            ? {
                items: [
                  {
                    id:
                      new URL(url).searchParams.get('page') === '2'
                        ? '00000000-0000-4000-8000-000000000010'
                        : '00000000-0000-4000-8000-000000000011',
                    name:
                      new URL(url).searchParams.get('page') === '2'
                        ? 'Disciplina da segunda página'
                        : 'Disciplina da primeira página',
                    currentLevel: 'INTERMEDIATE',
                    objective: 'Objetivo próprio',
                    dueDate: '2027-01-20',
                    weeklyHours: 2,
                    knownTopics: [],
                    planItems: [],
                    createdAt: '2026-11-02T12:00:00Z',
                    updatedAt: '2026-11-02T12:00:00Z',
                    studySummary: {
                      source: 'manual',
                      total: 0,
                      completed: 0,
                      progressPercent: null,
                    },
                  },
                ],
                page: Number(new URL(url).searchParams.get('page')),
                pageSize: 100,
                total: 2,
                totalPages: 2,
              }
            : {
                items: [],
                page: 1,
                pageSize: 100,
                total: 0,
                totalPages: 0,
              },
        );
      if (path.endsWith('/imports')) return Response.json(result);
      if (path.endsWith('/retry')) return Response.json(result);
      if (path.endsWith('/profile/preferences')) return Response.json(body);
      if (path.endsWith('/profile/onboarding'))
        return Response.json({ ...body, version: 1 });
      throw new Error(`Unexpected fixture route ${path}`);
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('does not contact Classroom or AI implicitly when disconnected', async () => {
  disconnected = true;
  render(<ClassroomSection prefs={{ ...prefs, ai: true }} />);
  expect(
    await screen.findByRole('button', { name: 'Conectar Google Classroom' }),
  ).toBeTruthy();
  expect(calls.every((call) => call.method === 'GET')).toBe(true);
  expect(calls.some((call) => /courses|note-generations/.test(call.path))).toBe(
    false,
  );
});

it('offers only imports even with subjects and AI enabled', async () => {
  render(<ClassroomSection prefs={{ ...prefs, subjects: true, ai: true }} />);
  await screen.findByRole('checkbox', { name: 'Matemática' });
  expect(
    screen.queryByRole('heading', { name: 'Notas de estudo com IA' }),
  ).toBeNull();
  expect(screen.queryByText(/PDFs|Drive|Gerar notas/)).toBeNull();
  expect(
    calls.some((call) =>
      /note-generations|drive|courseWorkMaterials/.test(call.path),
    ),
  ).toBe(false);
});
it('selects a course by keyboard and imports independent tasks explicitly', async () => {
  const user = userEvent.setup();
  render(<ClassroomSection prefs={prefs} />);
  const checkbox = await screen.findByRole('checkbox', { name: 'Matemática' });
  checkbox.focus();
  await user.keyboard(' ');
  expect(screen.queryByText('Disciplina para Matemática')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Importar seleção' }));
  await waitFor(() =>
    expect(
      calls.some(
        (call) => call.path.endsWith('/imports') && call.method === 'POST',
      ),
    ).toBe(true),
  );
  expect(calls.find((call) => call.method === 'PUT')?.body).toMatchObject({
    courses: [{ courseId: 'course1', destination: { kind: 'none' } }],
  });
  expect(calls.some((call) => call.path.endsWith('/note-generations'))).toBe(
    false,
  );
  expect(await screen.findByText('Parcialmente concluída')).toBeTruthy();
});
it('shows partial results and retries without hiding the failed content', async () => {
  latest = result;
  const user = userEvent.setup();
  render(<ClassroomSection prefs={prefs} />);
  await screen.findByRole('button', { name: 'Mais detalhes' });
  expect(screen.queryByText('Atividade inacessível')).toBeNull();
  expect(screen.queryByText('Turmas selecionadas')).toBeNull();
  await user.click(
    screen.getByRole('button', { name: 'Alterar seleção de matérias' }),
  );
  expect(screen.getByText('Turmas selecionadas')).toBeTruthy();
  await user.click(
    await screen.findByRole('button', { name: 'Mais detalhes' }),
  );
  expect(await screen.findByText('Atividade inacessível')).toBeTruthy();
  expect(screen.getByText(/Acesso negado pelo Google/)).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Fechar' }));
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(
    calls.some(
      (call) => call.path.endsWith('/retry') && call.method === 'POST',
    ),
  ).toBe(true);
});
it('continues onboarding after an integration error without calling AI', async () => {
  offline = true;
  const user = userEvent.setup();
  render(
    <OnboardingGate
      initialStep="modules"
      prefs={prefs}
      onPreferences={() => {}}
    >
      <p>Conta pronta para estudar</p>
    </OnboardingGate>,
  );
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
  expect(await screen.findByText('Conexão indisponível.')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Agora não' }));
  expect(await screen.findByText('Conta pronta para estudar')).toBeTruthy();
  expect(calls.some((call) => call.path.endsWith('/note-generations'))).toBe(
    false,
  );
});

it('seleciona todas as páginas sem importar e permite desmarcar individualmente', async () => {
  pages = true;
  const user = userEvent.setup();
  render(<ClassroomSection prefs={prefs} />);
  await user.click(
    await screen.findByRole('button', { name: 'Selecionar todas as matérias' }),
  );
  await screen.findByText(
    'Todas as matérias ativas foram selecionadas. Revise os destinos antes de importar.',
  );
  expect(
    screen
      .getByRole('checkbox', { name: 'Matemática' })
      .getAttribute('aria-checked'),
  ).toBe('true');
  expect(
    screen
      .getByRole('checkbox', { name: 'Física' })
      .getAttribute('aria-checked'),
  ).toBe('true');
  await user.click(screen.getByRole('checkbox', { name: 'Física' }));
  expect(
    screen
      .getByRole('checkbox', { name: 'Física' })
      .getAttribute('aria-checked'),
  ).toBe('false');
  expect(calls.some((call) => call.method !== 'GET')).toBe(false);
});

it.each(['failure', 'repeat'])(
  'preserva seleção anterior em falha de paginação: %s',
  async (mode) => {
    pages = true;
    pageFailure = mode === 'failure';
    repeatToken = mode === 'repeat';
    const user = userEvent.setup();
    render(<ClassroomSection prefs={prefs} />);
    await user.click(
      await screen.findByRole('checkbox', { name: 'Matemática' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Selecionar todas as matérias' }),
    );
    await screen.findByRole('alert');
    expect(
      screen
        .getByRole('checkbox', { name: 'Matemática' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect(screen.queryByRole('checkbox', { name: 'Física' })).toBeNull();
    expect(
      screen.queryByText(
        'Todas as matérias ativas foram selecionadas. Revise os destinos antes de importar.',
      ),
    ).toBeNull();
  },
);

it('exige destino ou confirmação explícita de somente tarefas', async () => {
  const user = userEvent.setup();
  render(<ClassroomSection prefs={{ ...prefs, subjects: true }} />);
  await user.click(await screen.findByRole('checkbox', { name: 'Matemática' }));
  await user.click(screen.getByRole('button', { name: 'Importar seleção' }));
  await screen.findByRole('alert');
  expect(calls.some((call) => call.path.endsWith('/imports'))).toBe(false);
  await user.click(
    screen.getByRole('checkbox', {
      name: 'Importar somente tarefas',
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Importar seleção' }));
  await screen.findByText('Parcialmente concluída');
  expect(calls.some((call) => call.path.endsWith('/imports'))).toBe(true);
});

it('mantém foco no modal, fecha com Escape e retorna ao acionador', async () => {
  latest = result;
  const user = userEvent.setup();
  render(<ClassroomSection prefs={prefs} />);
  const trigger = await screen.findByRole('button', { name: 'Mais detalhes' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog');
  expect(dialog.contains(document.activeElement)).toBe(true);
  await user.keyboard('{Shift>}{Tab}{/Shift}');
  expect(dialog.contains(document.activeElement)).toBe(true);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

it('opens a new subject draft with defaults and requires explicit confirmation', async () => {
  const user = userEvent.setup();
  render(<ClassroomSection prefs={{ ...prefs, subjects: true }} />);
  await user.click(await screen.findByRole('checkbox', { name: 'Matemática' }));
  expect(screen.getByLabelText('Objetivo').getAttribute('value')).toBe(
    'Estudar e me aprimorar em Matemática',
  );
  expect(screen.getByText('Intermediário')).toBeTruthy();
  await user.click(
    screen.getByRole('button', { name: 'Confirmar dados desta disciplina' }),
  );
  await user.click(screen.getByRole('button', { name: 'Importar seleção' }));
  await screen.findByText('Parcialmente concluída');
  expect(calls.find((call) => call.method === 'PUT')?.body).toMatchObject({
    courses: [
      {
        destination: {
          kind: 'new',
          subject: {
            name: 'Matemática',
            currentLevel: 'INTERMEDIATE',
            weeklyHours: 1,
          },
        },
      },
    ],
  });
});
it('hides stale import information when disconnected after a partial result', async () => {
  latest = result;
  disconnected = true;
  render(<ClassroomSection prefs={prefs} />);
  await screen.findByRole('button', { name: 'Conectar Google Classroom' });
  expect(screen.queryByText('Parcialmente concluída')).toBeNull();
  expect(screen.queryByText('student@example.test')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Mais detalhes' })).toBeNull();
  expect(calls.some((call) => call.path.endsWith('/operations'))).toBe(false);
});

it('offers owned subjects from all pages in the existing destination Select', async () => {
  subjectPages = true;
  const user = userEvent.setup();
  render(<ClassroomSection prefs={{ ...prefs, subjects: true }} />);
  await user.click(await screen.findByRole('checkbox', { name: 'Matemática' }));
  await user.click(
    screen.getByRole('combobox', { name: 'Disciplina de destino' }),
  );
  await user.click(
    screen.getByRole('option', { name: 'Usar disciplina existente' }),
  );
  await user.click(
    screen.getByRole('combobox', { name: 'Disciplina cadastrada' }),
  );
  await user.click(
    screen.getByRole('option', { name: 'Disciplina da segunda página' }),
  );
  await user.click(screen.getByRole('button', { name: 'Importar seleção' }));
  await screen.findByText('Parcialmente concluída');
  expect(calls.find((call) => call.method === 'PUT')?.body).toMatchObject({
    courses: [
      {
        destination: {
          kind: 'existing',
          subjectId: '00000000-0000-4000-8000-000000000010',
        },
      },
    ],
  });
});
it('disconnects after a result and removes import controls and identity', async () => {
  latest = result;
  const user = userEvent.setup();
  render(<ClassroomSection prefs={prefs} />);
  await screen.findByRole('button', { name: 'Mais detalhes' });
  await user.click(screen.getByRole('button', { name: 'Desconectar' }));
  await user.click(
    screen.getByRole('button', { name: 'Confirmar desconexão' }),
  );
  await screen.findByRole('button', { name: 'Conectar Google Classroom' });
  expect(screen.queryByText('student@example.test')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Mais detalhes' })).toBeNull();
  expect(screen.queryByText('Parcialmente concluída')).toBeNull();
});

it('ignores an import response arriving after disconnect', async () => {
  const original = fetch;
  let release!: (response: Response) => void;
  const delayed = new Promise<Response>((resolve) => {
    release = resolve;
  });
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) =>
      new URL(url).pathname.endsWith('/operations')
        ? delayed
        : original(url, options),
    ),
  );
  const user = userEvent.setup();
  render(<ClassroomSection prefs={prefs} />);
  await user.click(await screen.findByRole('button', { name: 'Desconectar' }));
  await user.click(
    screen.getByRole('button', { name: 'Confirmar desconexão' }),
  );
  await screen.findByRole('button', { name: 'Conectar Google Classroom' });
  release(Response.json(result));
  await waitFor(() =>
    expect(screen.queryByText('Parcialmente concluída')).toBeNull(),
  );
  expect(screen.queryByRole('button', { name: 'Mais detalhes' })).toBeNull();
  expect(screen.queryByText('student@example.test')).toBeNull();
});
