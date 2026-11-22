import type { DataSource } from 'typeorm';

/** Real active intervals in terminal sessions; pauses and running sessions are excluded. */
export async function subjectStudyEvidence(
  source: DataSource,
  userId: string,
  subjectId: string,
  start: Date,
  recentStart: Date,
  now: Date,
) {
  const rows = await source.query<Array<{ started_at: Date; ended_at: Date }>>(
    `SELECT i.started_at,i.ended_at FROM pomodoro_active_intervals i
    JOIN pomodoro_sessions s ON s.id=i.session_id AND s.user_id=i.user_id
    WHERE i.user_id=? AND s.user_id=? AND s.subject_id=? AND s.state IN ('COMPLETED','CANCELED')
    AND i.started_at<? AND i.ended_at>?`,
    [userId, userId, subjectId, now, start],
  );
  const hours = (from: Date) =>
    rows.reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          Math.min(now.getTime(), row.ended_at.getTime()) -
            Math.max(from.getTime(), row.started_at.getTime()),
        ),
      0,
    ) / 3600000;
  return {
    hours: hours(start),
    recentHours: hours(recentStart),
    intervals: rows.length,
  };
}
