import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { PomodoroSession } from '@study-platform/contracts';
import { DashboardPomodoro } from './DashboardPomodoro.js';
import { currentPomodoro } from '../pomodoro/pomodoro-api.js';
vi.mock('../pomodoro/pomodoro-api.js', () => ({ currentPomodoro: vi.fn() }));
const session: PomodoroSession = {
  id: '00000000-0000-4000-8000-000000000001',
  taskId: null,
  subjectId: null,
  state: 'RUNNING',
  activeSeconds: 0,
  completedBlocks: 0,
  remainingSeconds: 1500,
  version: 1,
  startedAt: '2026-11-04T12:00:00.000Z',
  endedAt: null,
  serverTime: '2026-11-04T12:00:00.000Z',
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});
it('ticks, reconciles a pause from another tab and cleans up polling', async () => {
  vi.useFakeTimers();
  vi.mocked(currentPomodoro).mockResolvedValue(session);
  const view = render(<DashboardPomodoro initial={session} />);
  await act(async () => {});
  expect(screen.getByRole('timer').textContent).toBe('25:00');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(screen.getByRole('timer').textContent).toBe('24:58');
  vi.mocked(currentPomodoro).mockResolvedValue({
    ...session,
    state: 'PAUSED',
    remainingSeconds: 1497,
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  expect(screen.getByText('Pausada')).toBeTruthy();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000);
  });
  expect(screen.getByRole('timer').textContent).toBe('24:57');
  view.unmount();
  const calls = vi.mocked(currentPomodoro).mock.calls.length;
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(currentPomodoro).toHaveBeenCalledTimes(calls);
});
it('stops at the boundary and reports a failed reconciliation without confirmed time', async () => {
  vi.useFakeTimers();
  const ending = { ...session, remainingSeconds: 1 };
  vi.mocked(currentPomodoro)
    .mockResolvedValueOnce(ending)
    .mockRejectedValue(new Error('offline'));
  render(<DashboardPomodoro initial={ending} />);
  await act(async () => {});
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(screen.getByRole('alert').textContent).toContain(
    'Não foi possível sincronizar',
  );
  expect(screen.queryByRole('timer')).toBeNull();
});
it('does not overlap requests and ignores responses after unmount', async () => {
  vi.useFakeTimers();
  let resolve!: (value: PomodoroSession) => void;
  vi.mocked(currentPomodoro).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const view = render(<DashboardPomodoro initial={session} />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(currentPomodoro).toHaveBeenCalledTimes(1);
  view.unmount();
  await act(async () => resolve(session));
  expect(screen.queryByRole('timer')).toBeNull();
});
