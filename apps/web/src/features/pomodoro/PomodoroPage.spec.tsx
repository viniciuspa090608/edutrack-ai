import {
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
const row: PomodoroSession = {
  id: '00000000-0000-4000-8000-000000000001',
  taskId: null,
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
afterEach(cleanup);
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
  expect(api.startPomodoro).toHaveBeenCalledWith(undefined);
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
  expect(screen.getByText(/Tempo ativo total: 10:00/)).toBeTruthy();
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
  await waitFor(() => expect(api.startPomodoro).toHaveBeenCalledWith(row.id));
  expect(screen.getByText(/Total estudado: 10:00/)).toBeTruthy();
  expect(screen.getByText(/Cancelada · 10:00/)).toBeTruthy();
});
