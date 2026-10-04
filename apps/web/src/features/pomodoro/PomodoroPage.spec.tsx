import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PomodoroSession } from '@study-platform/contracts';
import { PomodoroPage } from './PomodoroPage.js';
import * as api from './pomodoro-api.js';
import { listSubjects } from '../subjects/subjects-api.js';
import { listTasks } from '../tasks/tasks-api.js';
import { App } from '../../app/App.js';
import { AuthApiError, currentUser } from '../auth/auth-api.js';
import { preferences } from '../profile/profile-api.js';
vi.mock('../auth/auth-api.js', async (original) => ({
  ...(await original<typeof import('../auth/auth-api.js')>()),
  currentUser: vi.fn(),
}));
vi.mock('../profile/profile-api.js');
vi.mock('./pomodoro-api.js');
vi.mock('../tasks/tasks-api.js');
vi.mock('../subjects/subjects-api.js');
const row: PomodoroSession = {
  id: '00000000-0000-4000-8000-000000000001',
  taskId: null,
  subjectId: null,
  state: 'RUNNING',
  activeSeconds: 600,
  completedBlocks: 0,
  remainingSeconds: 900,
  version: 0,
  startedAt: '2026-09-26T12:00:00.000Z',
  endedAt: null,
  serverTime: '2026-09-26T12:10:00.000Z',
};
let current: PomodoroSession | null;
beforeEach(() => {
  vi.resetAllMocks();
  current = null;
  vi.mocked(listSubjects).mockResolvedValue({
    items: [],
    page: 1,
    pageSize: 100,
    total: 0,
    totalPages: 0,
  });
  vi.mocked(api.currentPomodoro).mockImplementation(async () => current);
  vi.mocked(api.pomodoroHistory).mockResolvedValue({
    items: [],
    total: 0,
    totalPages: 0,
    page: 1,
    pageSize: 20,
  });
  vi.mocked(api.pomodoroSummary).mockResolvedValue({
    activeSeconds: 0,
    completedBlocks: 0,
  });
  vi.mocked(api.startPomodoro).mockImplementation(async () => {
    current = { ...row };
    return current;
  });
  vi.mocked(listTasks).mockResolvedValue({
    items: [],
    page: 1,
    pageSize: 100,
    total: 0,
    totalPages: 0,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.documentElement.classList.remove('dark');
});
it('protects the Pomodoro route and keeps its return path for login', async () => {
  window.history.replaceState({}, '', '/app/pomodoro');
  vi.mocked(currentUser).mockRejectedValue(
    new AuthApiError(401, 'UNAUTHENTICATED'),
  );
  render(<App />);
  await waitFor(() => expect(window.location.pathname).toBe('/acesso'));
  expect(new URLSearchParams(window.location.search).get('returnTo')).toBe(
    '/app/pomodoro',
  );
});
it('renders authenticated Pomodoro independently of disabled tasks', async () => {
  window.history.replaceState({}, '', '/app/pomodoro');
  vi.mocked(currentUser).mockResolvedValue({
    id: row.id,
    email: 'study@example.com',
    googleLinked: true,
  });
  vi.mocked(preferences).mockResolvedValue({
    tasks: false,
    subjects: true,
    flashcards: false,
    ai: false,
  });
  render(<App />);
  await screen.findByRole('button', { name: 'Iniciar sessão' });
  expect(
    screen.getByRole('link', { name: 'Pomodoro' }).getAttribute('href'),
  ).toBe('/app/pomodoro');
  expect(listTasks).not.toHaveBeenCalled();
});
it('starts without tasks and uses keyboard cancel confirmation while preserving time', async () => {
  const user = userEvent.setup();
  render(<PomodoroPage tasksEnabled={false} />);
  const start = await screen.findByRole('button', { name: 'Iniciar sessão' });
  expect(listTasks).not.toHaveBeenCalled();
  expect(screen.queryByRole('combobox')).toBeNull();
  start.focus();
  await user.keyboard('{Enter}');
  await screen.findByRole('button', { name: 'Pausar' });
  expect(api.startPomodoro).toHaveBeenCalledWith(undefined, undefined);
  expect(screen.queryByRole('button', { name: 'Concluir' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Cancelar sessão' }));
  const keep = screen.getByRole('button', { name: 'Manter sessão' });
  expect(document.activeElement).toBe(keep);
  await user.keyboard('{Enter}');
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Cancelar sessão' }),
  );
  vi.mocked(api.commandPomodoro).mockImplementation(async () => {
    current = null;
    return { ...row, state: 'CANCELED', endedAt: row.serverTime, version: 1 };
  });
  await user.click(screen.getByRole('button', { name: 'Cancelar sessão' }));
  await user.click(
    screen.getByRole('button', { name: 'Confirmar cancelamento' }),
  );
  await screen.findByText('Sessão cancelada. Seu tempo foi preservado.');
  expect(api.commandPomodoro).toHaveBeenCalledWith(row.id, 'cancel', 0);
});
it('recovers server state after a lost pause response and resumes without paused time', async () => {
  current = { ...row };
  render(<PomodoroPage tasksEnabled={false} />);
  await screen.findByRole('button', { name: 'Pausar' });
  vi.mocked(api.commandPomodoro).mockImplementationOnce(async () => {
    current = { ...row, state: 'PAUSED', version: 1 };
    throw new Error('lost response');
  });
  fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
  await screen.findByRole('button', { name: 'Continuar' });
  expect(api.currentPomodoro).toHaveBeenCalledTimes(2);
  expect(screen.getByText('Tempo ativo total:').textContent).toContain('10:00');
  expect(screen.getByRole('alert').textContent).toContain(
    'Confira o estado recuperado',
  );
  vi.mocked(api.commandPomodoro).mockImplementationOnce(async () => {
    current = { ...row, version: 2 };
    return current;
  });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByRole('button', { name: 'Pausar' });
  expect(api.commandPomodoro).toHaveBeenLastCalledWith(row.id, 'resume', 1);
});
it('restores paused sessions on focus and exposes contextual next-block and completion controls', async () => {
  current = { ...row, state: 'PAUSED' };
  render(<PomodoroPage tasksEnabled={false} />);
  await screen.findByRole('button', { name: 'Continuar' });
  expect(screen.getByLabelText('Tempo restante no bloco').textContent).toBe(
    '15:00',
  );
  current = {
    ...row,
    state: 'BETWEEN_BLOCKS',
    activeSeconds: 1500,
    completedBlocks: 1,
    remainingSeconds: 0,
  };
  fireEvent(window, new Event('focus'));
  await screen.findByRole('button', { name: 'Iniciar próximo bloco' });
  expect(screen.getByRole('button', { name: 'Concluir' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Pausar' })).toBeNull();
});
it('blocks further commands until state recovery succeeds', async () => {
  current = { ...row };
  render(<PomodoroPage tasksEnabled={false} />);
  await screen.findByRole('button', { name: 'Pausar' });
  vi.mocked(api.commandPomodoro).mockRejectedValue(new Error('offline'));
  vi.mocked(api.currentPomodoro).mockRejectedValue(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Pausar' }).hasAttribute('disabled'),
    ).toBe(true),
  );
  vi.mocked(api.currentPomodoro).mockResolvedValue({ ...row, state: 'PAUSED' });
  fireEvent.click(screen.getByRole('button', { name: 'Sincronizar' }));
  await screen.findByRole('button', { name: 'Continuar' });
});
it('offers own task selection and terminal history totals', async () => {
  vi.mocked(listTasks).mockResolvedValue({
    items: [
      {
        id: row.id,
        subjectId: null,
        title: 'Álgebra',
        description: null,
        priority: 'MEDIUM',
        status: 'PENDING',
        dueDate: null,
        createdAt: row.startedAt,
        updatedAt: row.startedAt,
        subtaskTotal: 0,
        subtaskCompleted: 0,
        progressPercent: null,
      },
    ],
    page: 1,
    pageSize: 100,
    total: 1,
    totalPages: 1,
  });
  vi.mocked(api.pomodoroHistory).mockResolvedValue({
    items: [{ ...row, state: 'CANCELED', endedAt: row.serverTime }],
    page: 1,
    pageSize: 20,
    total: 1,
    totalPages: 1,
  });
  vi.mocked(api.pomodoroSummary).mockResolvedValue({
    activeSeconds: 600,
    completedBlocks: 0,
  });
  render(<PomodoroPage tasksEnabled />);
  await screen.findByRole('option', { name: 'Álgebra' });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: row.id } });
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sessão' }));
  await waitFor(() =>
    expect(api.startPomodoro).toHaveBeenCalledWith(row.id, undefined),
  );
  expect(screen.getByLabelText('Total estudado').textContent).toContain(
    '10:00',
  );
  expect(screen.getByText('Cancelada').closest('li')?.textContent).toContain(
    '10:00',
  );
});

it('selects a subject without a task, filters history and hides selectors when disabled', async () => {
  vi.mocked(listSubjects).mockResolvedValue({
    items: [
      {
        id: row.id,
        name: 'Matemática',
        currentLevel: 'BEGINNER',
        objective: 'Aprender',
        dueDate: '2026-10-01',
        weeklyHours: 1,
        knownTopics: [],
        planItems: [],
        createdAt: row.startedAt,
        updatedAt: row.startedAt,
      },
    ],
    page: 1,
    pageSize: 100,
    total: 1,
    totalPages: 1,
  });
  const interaction = userEvent.setup();
  const view = render(<PomodoroPage tasksEnabled={false} subjectsEnabled />);
  await waitFor(() =>
    expect(
      (screen.getByLabelText('Matéria (opcional)') as HTMLSelectElement)
        .disabled,
    ).toBe(false),
  );
  await interaction.selectOptions(
    screen.getByLabelText('Matéria (opcional)'),
    row.id,
  );
  await interaction.click(
    screen.getByRole('button', { name: 'Iniciar sessão' }),
  );
  await waitFor(() =>
    expect(api.startPomodoro).toHaveBeenCalledWith(undefined, row.id),
  );
  await interaction.selectOptions(
    screen.getByLabelText('Filtrar histórico por matéria'),
    row.id,
  );
  await waitFor(() =>
    expect(api.pomodoroHistory).toHaveBeenCalledWith(1, row.id),
  );
  view.unmount();
  render(<PomodoroPage tasksEnabled={false} subjectsEnabled={false} />);
  expect(screen.queryByLabelText('Filtrar histórico por matéria')).toBeNull();
});

it('updates the clock from elapsed time, freezes on pause and waits at the block boundary', async () => {
  current = { ...row, remainingSeconds: 2, activeSeconds: 1498 };
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] });
  const view = render(<PomodoroPage tasksEnabled={false} />);
  await act(async () => {});
  fireEvent(window, new Event('focus'));
  await act(async () => {});
  expect(screen.getByLabelText('Tempo restante no bloco').textContent).toBe(
    '0:02',
  );
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByLabelText('Tempo restante no bloco').textContent).toBe(
    '0:01',
  );
  current = {
    ...row,
    state: 'PAUSED',
    remainingSeconds: 1,
    activeSeconds: 1499,
  };
  fireEvent(window, new Event('focus'));
  await act(async () => {});
  await act(async () => {
    vi.advanceTimersByTime(5000);
  });
  expect(screen.getByLabelText('Tempo restante no bloco').textContent).toBe(
    '0:01',
  );
  current = { ...row, remainingSeconds: 1, activeSeconds: 1499 };
  fireEvent(window, new Event('focus'));
  await act(async () => {});
  current = {
    ...row,
    state: 'BETWEEN_BLOCKS',
    remainingSeconds: 0,
    activeSeconds: 1500,
    completedBlocks: 1,
  };
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
  expect(screen.getByLabelText('Tempo restante no bloco').textContent).toBe(
    '0:00',
  );
  expect(
    screen.getByRole('button', { name: 'Iniciar próximo bloco' }),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Pausar' })).toBeNull();
  expect(api.commandPomodoro).not.toHaveBeenCalled();
  view.unmount();
});

it('keeps session and confirmation controls when the theme changes without sending a command', async () => {
  current = { ...row, state: 'PAUSED' };
  const view = render(<PomodoroPage tasksEnabled={false} />);
  await screen.findByRole('button', { name: 'Continuar' });
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Cancelar sessão' }));
  document.documentElement.classList.add('dark');
  view.rerender(<PomodoroPage tasksEnabled={false} />);
  expect(screen.getByRole('alertdialog').className).toContain(
    'pomodoro-surface',
  );
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Manter sessão' }),
  );
  expect(screen.getByLabelText('Tempo restante no bloco').textContent).toBe(
    '15:00',
  );
  await user.keyboard('{Escape}');
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Cancelar sessão' }),
  );
  expect(api.commandPomodoro).not.toHaveBeenCalled();
});

it('confirms the next block and completion using the same session version and API totals', async () => {
  current = {
    ...row,
    state: 'BETWEEN_BLOCKS',
    remainingSeconds: 0,
    activeSeconds: 1500,
    completedBlocks: 1,
    version: 3,
  };
  render(<PomodoroPage tasksEnabled={false} />);
  await screen.findByRole('button', { name: 'Iniciar próximo bloco' });
  vi.mocked(api.commandPomodoro).mockImplementationOnce(async () => {
    current = {
      ...current!,
      state: 'RUNNING',
      remainingSeconds: 1500,
      version: 4,
    };
    return current;
  });
  fireEvent.click(
    screen.getByRole('button', { name: 'Iniciar próximo bloco' }),
  );
  await screen.findByRole('button', { name: 'Pausar' });
  expect(api.commandPomodoro).toHaveBeenLastCalledWith(row.id, 'next-block', 3);
  vi.mocked(api.commandPomodoro).mockImplementationOnce(async () => {
    const ended = {
      ...current!,
      state: 'COMPLETED' as const,
      endedAt: row.serverTime,
      version: 5,
    };
    current = null;
    return ended;
  });
  fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
  await screen.findByText('Sessão concluída.');
  expect(api.commandPomodoro).toHaveBeenLastCalledWith(row.id, 'complete', 4);
  expect(screen.getByLabelText('Total estudado').textContent).toContain('0:00');
});

it('shows loading, recovery error and both empty surfaces without inventing an active timer', async () => {
  let resolveCurrent!: (value: PomodoroSession | null) => void;
  vi.mocked(api.currentPomodoro).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveCurrent = resolve;
      }),
  );
  render(<PomodoroPage tasksEnabled={false} />);
  expect(screen.getByText('Carregando…')).toBeTruthy();
  expect(screen.queryByLabelText('Tempo restante no bloco')).toBeNull();
  await act(async () => {
    resolveCurrent(null);
  });
  await screen.findByRole('button', { name: 'Iniciar sessão' });
  expect(screen.getByText('Nenhuma sessão encerrada.')).toBeTruthy();
  vi.mocked(api.currentPomodoro).mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Sincronizar' }));
  await screen.findByRole('alert');
  expect(screen.queryByRole('button', { name: 'Iniciar sessão' })).toBeNull();
  expect(
    screen.getByText('Sincronize para recuperar sua sessão antes de iniciar.'),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Sincronizar' }));
  await screen.findByRole('button', { name: 'Iniciar sessão' });
});

it('preserves history pagination, ended dates and unresolved task references', async () => {
  vi.mocked(api.pomodoroHistory).mockImplementation(async (page = 1) => ({
    items: [
      {
        ...row,
        id: row.id,
        taskId: row.id,
        state: 'COMPLETED',
        endedAt: row.serverTime,
        activeSeconds: 1500,
        completedBlocks: 1,
      },
    ],
    page,
    pageSize: 20,
    total: 21,
    totalPages: 2,
  }));
  render(<PomodoroPage tasksEnabled={false} />);
  await screen.findByText('Concluída');
  const entry = screen.getByText('Concluída').closest('li');
  expect(entry?.textContent).toContain(`Tarefa ${row.id}`);
  expect(
    entry?.querySelector('time[datetime="2026-09-26T12:10:00.000Z"]'),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
  await screen.findByText('Página 2 de 2');
  expect(api.pomodoroHistory).toHaveBeenLastCalledWith(2, undefined);
  expect(
    screen.getByRole('button', { name: 'Próxima' }).hasAttribute('disabled'),
  ).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
  await screen.findByText('Página 1 de 2');
  expect(listTasks).not.toHaveBeenCalled();
});
