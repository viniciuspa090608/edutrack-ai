import { recordStudyActivity } from '../study-progress/activity-recorder.js';
import type { EntityManager } from 'typeorm';
export type ActivityKind =
  | 'TASK_COMPLETED'
  | 'FLASHCARD_REVIEWED'
  | 'SUBJECT_PLAN_ITEM_COMPLETED'
  | 'ROADMAP_BLOCK_COMPLETED'
  | 'POMODORO_SESSION_COMPLETED'
  | 'POMODORO_BLOCK_COMPLETED';
/** Public producer contract. Call inside the transaction that confirms the transition. */
export async function publishActivity(
  manager: EntityManager,
  userId: string,
  kind: ActivityKind,
  sourceType: string,
  sourceId: string,
  transitionId?: string,
  occurredAt?: Date,
  eligible = true,
) {
  const now =
    occurredAt ??
    (
      await manager.query<Array<{ now: Date }>>(
        'SELECT UTC_TIMESTAMP(3) AS now',
      )
    )[0]!.now;
  return recordStudyActivity(
    manager,
    userId,
    kind,
    { type: sourceType, id: sourceId, transitionId },
    now,
    eligible,
  );
}
