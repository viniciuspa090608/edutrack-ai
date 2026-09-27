import type { EntityManager } from 'typeorm';
/** Public read interface: only real intervals from terminal sessions of this account. */
export function terminalIntervals(
  manager: EntityManager,
  userId: string,
  start: Date,
  end: Date,
) {
  return manager.query<Array<{ started_at: Date; ended_at: Date }>>(
    `SELECT i.started_at,i.ended_at FROM pomodoro_active_intervals i JOIN pomodoro_sessions s ON s.id=i.session_id AND s.user_id=i.user_id WHERE i.user_id=? AND s.state IN ('COMPLETED','CANCELED') AND i.started_at<? AND i.ended_at>?`,
    [userId, end, start],
  );
}
