import { randomUUID } from 'node:crypto';
import { Temporal } from '@js-temporal/polyfill';
import type { EntityManager } from 'typeorm';
import type { ActivityKind } from '../analytics/activity-publisher.js';
import { projectProgress } from './progress-projection.js';
import type { ProgressEvent } from './progress-projection.js';
export interface ActivitySource {
  type: string;
  id: string;
  transitionId?: string | undefined;
}
export async function lockStudyProgress(
  manager: EntityManager,
  userId: string,
) {
  const rows = await manager.query<
    Array<{ tracking_started_at_utc: Date; study_timezone: string }>
  >(
    'SELECT tracking_started_at_utc,study_timezone FROM study_progress_tracking WHERE user_id=? FOR UPDATE',
    [userId],
  );
  if (!rows[0]) throw new Error('Study progress tracking is not initialized');
  return rows[0];
}
/** Public contract, called within the transaction confirming the producer fact. */
export async function recordStudyActivity(
  manager: EntityManager,
  userId: string,
  kind: ActivityKind,
  source: ActivitySource,
  occurredAt: Date,
  eligible = true,
) {
  const tracking = await lockStudyProgress(manager, userId);
  let transitionId = source.transitionId;
  if (!transitionId) {
    if (!eligible) transitionId = randomUUID();
    else {
      await manager.query(
        'INSERT INTO study_activity_source_revisions (user_id,source_type,source_id,completion_revision) VALUES (?,?,?,1) ON DUPLICATE KEY UPDATE completion_revision=completion_revision+1',
        [userId, source.type, source.id],
      );
      const revisions = await manager.query<
        Array<{ completion_revision: string }>
      >(
        'SELECT completion_revision FROM study_activity_source_revisions WHERE user_id=? AND source_type=? AND source_id=? FOR UPDATE',
        [userId, source.type, source.id],
      );
      transitionId = String(revisions[0]!.completion_revision);
    }
  }
  const previous = await manager.query<Array<{ id: string }>>(
    'SELECT id FROM study_activity_events WHERE user_id=? AND source_type=? AND source_id=? AND source_transition_id=? AND kind=? FOR UPDATE',
    [userId, source.type, source.id, transitionId, kind],
  );
  if (previous.length) return;
  const credit =
    eligible &&
    kind !== 'POMODORO_SESSION_COMPLETED' &&
    occurredAt >= tracking.tracking_started_at_utc;
  const zones = credit
    ? await manager.query<Array<{ timezone_id: string }>>(
        'SELECT timezone_id FROM study_timezone_history WHERE user_id=? AND effective_at_utc<=? ORDER BY effective_at_utc DESC,id DESC LIMIT 1 FOR UPDATE',
        [userId, occurredAt],
      )
    : [];
  const zone = credit ? (zones[0]?.timezone_id ?? 'UTC') : null;
  const date = zone
    ? Temporal.Instant.fromEpochMilliseconds(occurredAt.getTime())
        .toZonedDateTimeISO(zone)
        .toPlainDate()
        .toString()
    : null;
  await manager.query(
    'INSERT INTO study_activity_events (id,user_id,kind,source_type,source_id,source_transition_id,occurred_at,timezone_id,local_date) VALUES (?,?,?,?,?,?,?,?,?)',
    [
      randomUUID(),
      userId,
      kind,
      source.type,
      source.id,
      transitionId,
      occurredAt,
      zone,
      date,
    ],
  );
  if (!credit) return;
  // Locking reads observe earlier concurrent commits even after a producer snapshot was opened.
  const events = await manager.query<ProgressEvent[]>(
    'SELECT id,kind,occurred_at,local_date FROM study_activity_events WHERE user_id=? AND local_date IS NOT NULL ORDER BY occurred_at,id FOR UPDATE',
    [userId],
  );
  const projection = projectProgress(events, date!);
  for (const [code, event] of projection.earned)
    await manager.query(
      'INSERT INTO study_achievement_grants (user_id,achievement_code,earned_at_utc,triggering_event_id) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE triggering_event_id=IF(VALUES(earned_at_utc)<earned_at_utc,VALUES(triggering_event_id),triggering_event_id),earned_at_utc=LEAST(earned_at_utc,VALUES(earned_at_utc))',
      [userId, code, event.occurred_at, event.id],
    );
}
