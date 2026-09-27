import { Temporal } from '@js-temporal/polyfill';
import {
  studyAchievementCatalog,
  studyProgressSchema,
  studyTimeZoneSettingsSchema,
  studyTimeZoneUpdateSchema,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import type { StudyProgressRepository } from './study-progress.repository.js';
import { projectProgress } from './progress-projection.js';
export class StudyProgressService {
  constructor(
    private readonly repository: StudyProgressRepository,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  settings(userId: string) {
    return this.repository.transaction(async (manager) => {
      const row = await this.repository.tracking(manager, userId);
      return studyTimeZoneSettingsSchema.parse({
        timeZone: row.study_timezone,
        trackingStartedAt: row.tracking_started_at_utc.toISOString(),
      });
    });
  }
  async changeTimeZone(userId: string, input: unknown) {
    const parsed = studyTimeZoneUpdateSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Informe um fuso IANA válido.');
    return this.repository.transaction(async (manager) => {
      await this.repository.changeTimeZone(
        manager,
        userId,
        parsed.data.timeZone,
        this.clock,
      );
      const row = await this.repository.tracking(manager, userId);
      return studyTimeZoneSettingsSchema.parse({
        timeZone: row.study_timezone,
        trackingStartedAt: row.tracking_started_at_utc.toISOString(),
      });
    });
  }
  read(userId: string) {
    return this.repository.transaction(async (manager) => {
      const row = await this.repository.tracking(manager, userId),
        now = this.clock();
      const today = Temporal.Instant.fromEpochMilliseconds(now.getTime())
        .toZonedDateTimeISO(row.study_timezone)
        .toPlainDate()
        .toString();
      const projection = projectProgress(
        await this.repository.events(manager, userId, now),
        today,
      );
      const grants = new Map(
        (await this.repository.grants(manager, userId)).map((grant) => [
          grant.achievement_code,
          grant.earned_at_utc,
        ]),
      );
      return studyProgressSchema.parse({
        timeZone: row.study_timezone,
        trackingStartedAt: row.tracking_started_at_utc.toISOString(),
        today,
        activeDays: projection.activeDays,
        currentStreak: projection.currentStreak,
        longestStreak: projection.longestStreak,
        achievements: studyAchievementCatalog.map((item) => ({
          ...item,
          progress: projection.progress[item.code],
          earnedAt: grants.get(item.code)?.toISOString() ?? null,
        })),
      });
    });
  }
}
