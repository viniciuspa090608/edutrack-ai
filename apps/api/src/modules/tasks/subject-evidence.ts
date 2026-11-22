import type { DataSource } from 'typeorm';

/** Public read contract for subject insights. Counts current tasks, never subtasks twice. */
export async function subjectTaskEvidence(
  source: DataSource,
  userId: string,
  subjectId: string,
  recentStart: Date,
  now: Date,
  today: string,
  soon: string,
) {
  const [row] = await source.query<
    Array<{
      total: string;
      completed: string;
      pending: string;
      soon: string;
      overdue: string;
      recent: string;
    }>
  >(
    `SELECT COUNT(*) AS total,COALESCE(SUM(t.status='COMPLETED'),0) AS completed,
    COALESCE(SUM(t.status<>'COMPLETED'),0) AS pending,
    COALESCE(SUM(t.status<>'COMPLETED' AND t.due_date>=? AND t.due_date<=?),0) AS soon,
    COALESCE(SUM(t.status<>'COMPLETED' AND t.due_date<?),0) AS overdue,
    COALESCE(SUM(t.status='COMPLETED' AND EXISTS(SELECT 1 FROM study_activity_events e WHERE e.user_id=t.user_id AND e.source_id=t.id AND e.kind='TASK_COMPLETED' AND e.occurred_at>=? AND e.occurred_at<=?)),0) AS recent
    FROM study_tasks t WHERE t.user_id=? AND t.subject_id=?`,
    [today, soon, today, recentStart, now, userId, subjectId],
  );
  return {
    total: Number(row!.total),
    completed: Number(row!.completed),
    pending: Number(row!.pending),
    soon: Number(row!.soon),
    overdue: Number(row!.overdue),
    recent: Number(row!.recent),
  };
}
