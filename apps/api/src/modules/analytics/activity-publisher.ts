import { randomUUID } from 'node:crypto';
import type { EntityManager } from 'typeorm';
export type ActivityKind =
  | 'TASK_COMPLETED'
  | 'FLASHCARD_REVIEWED'
  | 'SUBJECT_PLAN_ITEM_COMPLETED'
  | 'ROADMAP_BLOCK_COMPLETED'
  | 'POMODORO_SESSION_COMPLETED';
/** Public producer contract. Call inside the transaction that confirms the transition. */
export async function publishActivity(
  manager: EntityManager,
  userId: string,
  kind: ActivityKind,
  sourceType: string,
  sourceId: string,
  transitionId: string = randomUUID(),
  occurredAt?: Date,
) {
  await manager.query(
    `INSERT INTO study_activity_events (id,user_id,kind,source_type,source_id,source_transition_id,occurred_at) VALUES (?,?,?,?,?,?,${occurredAt ? '?' : 'UTC_TIMESTAMP(3)'}) ON DUPLICATE KEY UPDATE id=id`,
    [
      randomUUID(),
      userId,
      kind,
      sourceType,
      sourceId,
      transitionId,
      ...(occurredAt ? [occurredAt] : []),
    ],
  );
}
