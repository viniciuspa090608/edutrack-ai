import type { PomodoroSession } from '@study-platform/contracts';

export function projectPomodoro(session: PomodoroSession | null, tick: number) {
  const elapsed =
    session?.state === 'RUNNING'
      ? Math.min(Math.max(0, tick), session.remainingSeconds)
      : 0;
  const boundary =
    session?.state === 'RUNNING' && elapsed >= session.remainingSeconds;
  return {
    elapsed,
    boundary,
    remaining: session ? Math.max(0, session.remainingSeconds - elapsed) : 1500,
    state: boundary ? 'BETWEEN_BLOCKS' : session?.state,
    blocks: (session?.completedBlocks ?? 0) + (boundary ? 1 : 0),
  };
}

export function formatPomodoro(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
