import type { DataSource, EntityManager } from 'typeorm';
import type { AchievementCode } from '@study-platform/contracts';
import { lockStudyProgress } from './activity-recorder.js';
import type { ProgressEvent } from './progress-projection.js';
export interface TrackingRow {
  study_timezone: string;
  tracking_started_at_utc: Date;
}
export class StudyProgressRepository {
  constructor(private readonly source: DataSource) {}
  transaction<T>(work: (manager: EntityManager) => Promise<T>) {
    return this.source.transaction(work);
  }
  async tracking(manager: EntityManager, userId: string) {
    const rows = await manager.query<TrackingRow[]>(
      'SELECT study_timezone,tracking_started_at_utc FROM study_progress_tracking WHERE user_id=?',
      [userId],
    );
    if (!rows[0]) throw new Error('Study progress tracking is not initialized');
    return rows[0];
  }
  events(manager: EntityManager, userId: string, now: Date) {
    return manager.query<ProgressEvent[]>(
      'SELECT id,kind,occurred_at,local_date FROM study_activity_events WHERE user_id=? AND local_date IS NOT NULL AND occurred_at<=? ORDER BY occurred_at,id',
      [userId, now],
    );
  }
  grants(manager: EntityManager, userId: string) {
    return manager.query<
      Array<{ achievement_code: AchievementCode; earned_at_utc: Date }>
    >(
      'SELECT achievement_code,earned_at_utc FROM study_achievement_grants WHERE user_id=?',
      [userId],
    );
  }
  async changeTimeZone(
    manager: EntityManager,
    userId: string,
    zone: string,
    clock: () => Date,
  ) {
    const current = await lockStudyProgress(manager, userId);
    if (current.study_timezone === zone) return;
    const now = clock();
    await manager.query(
      'UPDATE study_progress_tracking SET study_timezone=? WHERE user_id=?',
      [zone, userId],
    );
    await manager.query(
      'INSERT INTO study_timezone_history (user_id,timezone_id,effective_at_utc) VALUES (?,?,?)',
      [userId, zone, now],
    );
  }
}
