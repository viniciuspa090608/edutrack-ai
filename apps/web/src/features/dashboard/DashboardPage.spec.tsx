import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import type { Dashboard, PomodoroSession } from '@study-platform/contracts';
import { studyAchievementCatalog } from '@study-platform/contracts';
import { DashboardPage } from './DashboardPage.js';
import { dashboard } from './dashboard-api.js';
import { currentPomodoro, startPomodoro } from '../pomodoro/pomodoro-api.js';
import { App } from '../../app/App.js';
import { within } from '@testing-library/react';
vi.mock('./dashboard-api.js', () => ({ dashboard: vi.fn() }));
vi.mock('../pomodoro/pomodoro-api.js', () => ({
  currentPomodoro: vi.fn(),
  startPomodoro: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  window.history.replaceState({}, '', '/');
});
const empty: Dashboard = {
  asOf: '2026-10-05T12:00:00.000Z',
  timeZone: 'UTC',
  preferences: { tasks: true, subjects: true, flashcards: true, ai: false },
  tasks: {
    state: 'empty',
    data: {
      counts: { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 },
      upcoming: [],
      withoutDeadline: 0,
    },
  },
  subjects: { state: 'empty', data: null },
  flashcards: { state: 'empty', data: { pending: 0 } },
  pomodoro: { state: 'empty', data: { session: null, completedSessions: 0 } },
  streak: {
    state: 'empty',
    data: {
      timeZone: 'UTC',
      trackingStartedAt: '2026-09-27T12:00:00.000Z',
      today: '2026-10-05',
      currentStreak: 0,
      longestStreak: 0,
      activeDays: 0,
      achievements: studyAchievementCatalog.map((item) => ({
        ...item,
        progress: 0,
        earnedAt: null,
      })),
    },
  },
  week: {
    state: 'empty',
    data: {
      timeZone: 'UTC',
      period: {
        start: '2026-10-05',
        end: '2026-10-12',
        partial: true,
        days: 7,
      },
      previousPeriod: {
        start: '2026-09-28',
        end: '2026-10-05',
        partial: false,
        days: 7,
      },
      metrics: {},
      series: [],
      frequency: { activeDays: 0, days: 7, status: 'available' },
    },
  },
};
const session: PomodoroSession = {
  id: '00000000-0000-4000-8000-000000000001',
  taskId: null,
  subjectId: null,
  state: 'RUNNING',
  activeSeconds: 0,
  completedBlocks: 0,
  remainingSeconds: 1500,
  version: 1,
  startedAt: empty.asOf,
  endedAt: null,
  serverTime: empty.asOf,
};
it('keeps official weekly totals and coverage even when the chart has different observations', async () => {
  if (empty.week.state === 'error') throw new Error('Invalid fixture');
  vi.mocked(dashboard).mockResolvedValue({
    ...empty,
    week: {
      state: 'ready',
      data: {
        ...empty.week.data,
        metrics: {
          activeMs: {
            current: 600000,
            previous: null,
            difference: null,
            percent: null,
            coverageStart: empty.asOf,
            currentStatus: 'available',
            previousStatus: 'history_unavailable',
          },
          tasks: {
            current: null,
            previous: null,
            difference: null,
            percent: null,
            coverageStart: empty.asOf,
            currentStatus: 'history_unavailable',
            previousStatus: 'history_unavailable',
          },
        },
        series: [{ date: '2026-10-05', values: { activeMs: 60000 } }],
        frequency: { activeDays: 1, days: 7, status: 'history_unavailable' },
      },
    },
  });
  render(<DashboardPage displayName="Ana" />);
  const section = await screen.findByRole('region', { name: 'Estatísticas' });
  expect(within(section).getByText('10 min')).toBeTruthy();
  expect(within(section).getByText('1 min')).toBeTruthy();
  expect(within(section).getByText('Histórico indisponível')).toBeTruthy();
  expect(within(section).getByText(/Histórico incompleto/)).toBeTruthy();
});

it('does not turn a null manual-plan progress into a zero progress bar', async () => {
  vi.mocked(dashboard).mockResolvedValue({
    ...empty,
    subjects: {
      state: 'ready',
      data: {
        id: session.id,
        name: 'Plano manual',
        dueDate: '2026-12-01',
        hasPending: false,
        source: 'manual',
        roadmapId: null,
        title: 'Plano',
        total: 0,
        completed: 0,
        progressPercent: null,
      },
    },
  });
  render(<DashboardPage displayName="Ana" />);
  const section = await screen.findByRole('region', { name: 'Matérias' });
  expect(within(section).queryByRole('progressbar')).toBeNull();
  expect(within(section).getByText(/0 de 0 concluídos/)).toBeTruthy();
});
it('shows loading, recoverable failure and genuine first steps for a new account', async () => {
  vi.mocked(dashboard).mockImplementationOnce(() => new Promise(() => {}));
  const first = render(<DashboardPage displayName="Ana" />);
  expect(screen.getByRole('status').textContent).toContain('Carregando');
  first.unmount();
  vi.mocked(dashboard)
    .mockRejectedValueOnce(new Error('network'))
    .mockResolvedValueOnce(empty);
  render(<DashboardPage displayName="Ana" />);
  expect(await screen.findByRole('alert')).toBeTruthy();
  await userEvent.click(
    screen.getByRole('button', { name: 'Tentar carregar dashboard novamente' }),
  );
  expect(await screen.findByText(/Crie sua primeira tarefa/)).toBeTruthy();
  expect(screen.getByText('0 cartões pendentes de revisão.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Iniciar Pomodoro' })).toBeTruthy();
});
it('keeps available cards on partial failure, retries by keyboard and preserves their prior values', async () => {
  const data: Dashboard = {
    ...empty,
    week: { state: 'error', message: 'Resumo semanal indisponível.' },
    tasks: {
      state: 'ready',
      data: {
        counts: { PENDING: 1, IN_PROGRESS: 0, COMPLETED: 0 },
        upcoming: [],
        withoutDeadline: 1,
      },
    },
  };
  vi.mocked(dashboard).mockResolvedValueOnce(data).mockResolvedValueOnce(empty);
  render(<DashboardPage displayName="Ana" />);
  expect(await screen.findByText('Resumo semanal indisponível.')).toBeTruthy();
  expect(screen.getByText(/Não há próximas tarefas com prazo/)).toBeTruthy();
  screen
    .getByRole('button', { name: 'Tentar novamente: Estatísticas' })
    .focus();
  await userEvent.setup().keyboard('{Enter}');
  expect(
    await screen.findByText(/Nenhuma atividade registrada nesta semana/),
  ).toBeTruthy();
  expect(screen.getByText(/1 tarefas ativas sem prazo/)).toBeTruthy();
});
it('omits disabled cards and refreshes visibility when preferences change in another tab', async () => {
  const minimal = {
    ...empty,
    preferences: {
      tasks: false,
      subjects: false,
      flashcards: false,
      ai: false,
    },
  };
  delete minimal.tasks;
  delete minimal.subjects;
  delete minimal.flashcards;
  vi.mocked(dashboard)
    .mockResolvedValueOnce(minimal)
    .mockResolvedValueOnce(empty);
  render(<DashboardPage displayName="Ana" />);
  expect(
    await screen.findByRole('link', { name: 'Reativar nas preferências' }),
  ).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Tarefas' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Abrir matérias' })).toBeNull();
  window.dispatchEvent(new Event('focus'));
  expect(await screen.findByRole('heading', { name: 'Tarefas' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Abrir flashcards' })).toBeTruthy();
});
it('shows official task progress, local overdue label and a contextual safe subject/roadmap link', async () => {
  const id = session.id;
  vi.mocked(dashboard).mockResolvedValue({
    ...empty,
    subjects: {
      state: 'ready',
      data: {
        id,
        name: 'Matemática',
        dueDate: '2026-12-01',
        hasPending: true,
        source: 'roadmap',
        roadmapId: id,
        title: 'Base',
        completed: 1,
        total: 2,
        progressPercent: 50,
      },
    },
    tasks: {
      state: 'ready',
      data: {
        ...(empty.tasks && empty.tasks.state !== 'error'
          ? empty.tasks.data
          : {
              counts: { PENDING: 0, IN_PROGRESS: 1, COMPLETED: 0 },
              upcoming: [],
              withoutDeadline: 0,
            }),
        upcoming: [
          {
            id,
            subjectId: null,
            title: 'Revisar',
            description: '',
            dueDate: '2026-10-04',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            subtaskTotal: 4,
            subtaskCompleted: 1,
            progressPercent: 25,
            createdAt: empty.asOf,
            updatedAt: empty.asOf,
          },
        ],
      },
    },
  });
  render(<DashboardPage displayName="Ana" />);
  expect(await screen.findByText('25% concluído')).toBeTruthy();
  expect(screen.getByText(/Atrasada/)).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'Abrir matérias' }).getAttribute('href'),
  ).toBe(`/app/materias?subject=${id}#roadmap-${id}`);
});
it('starts via the public command and reconciles conflicts or lost responses before navigating', async () => {
  vi.mocked(dashboard).mockResolvedValue(empty);
  vi.mocked(startPomodoro).mockRejectedValue(new Error('conflict'));
  vi.mocked(currentPomodoro).mockResolvedValue(session);
  render(<DashboardPage displayName="Ana" />);
  const button = await screen.findByRole('button', {
    name: 'Iniciar Pomodoro',
  });
  await userEvent.click(button);
  await waitFor(() => expect(window.location.pathname).toBe('/app/pomodoro'));
  expect(startPomodoro).toHaveBeenCalledTimes(1);
  expect(currentPomodoro).toHaveBeenCalledTimes(1);
});
it('does not repeat an uncertain start until current-session lookup succeeds', async () => {
  vi.mocked(dashboard).mockResolvedValue(empty);
  vi.mocked(startPomodoro).mockRejectedValue(new Error('network'));
  vi.mocked(currentPomodoro)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(session);
  render(<DashboardPage displayName="Ana" />);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Iniciar Pomodoro' }),
  );
  expect(
    await screen.findByText(/Não foi possível confirmar a sessão/),
  ).toBeTruthy();
  await userEvent.click(
    screen.getByRole('button', { name: 'Consultar sessão e iniciar' }),
  );
  await waitFor(() => expect(window.location.pathname).toBe('/app/pomodoro'));
  expect(startPomodoro).toHaveBeenCalledTimes(1);
});
it('offers resume for an existing session without issuing a start command', async () => {
  vi.mocked(dashboard).mockResolvedValue({
    ...empty,
    pomodoro: { state: 'ready', data: { session, completedSessions: 2 } },
  });
  render(<DashboardPage displayName="Ana" />);
  expect(
    await screen.findByRole('link', { name: 'Retomar Pomodoro' }),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Iniciar Pomodoro' })).toBeNull();
  expect(startPomodoro).not.toHaveBeenCalled();
});
it('starts a new Pomodoro once and navigates to its public page', async () => {
  vi.mocked(dashboard).mockResolvedValue(empty);
  vi.mocked(startPomodoro).mockResolvedValue(session);
  render(<DashboardPage displayName="Ana" />);
  const button = await screen.findByRole('button', {
    name: 'Iniciar Pomodoro',
  });
  button.focus();
  await userEvent.setup().keyboard('{Enter}');
  await waitFor(() => expect(window.location.pathname).toBe('/app/pomodoro'));
  expect(startPomodoro).toHaveBeenCalledTimes(1);
});
it('does not request private summaries before auth confirmation and redirects a missing session', async () => {
  window.history.replaceState({}, '', '/app');
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  );
  const first = render(<App />);
  expect(screen.getByText('Verificando sessão…')).toBeTruthy();
  expect(dashboard).not.toHaveBeenCalled();
  first.unmount();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json(
        { error: { code: 'UNAUTHENTICATED', message: 'Entre' } },
        { status: 401 },
      ),
    ),
  );
  render(<App />);
  expect(
    await screen.findByRole('heading', { name: 'Entre na sua conta' }),
  ).toBeTruthy();
  expect(dashboard).not.toHaveBeenCalled();
});
