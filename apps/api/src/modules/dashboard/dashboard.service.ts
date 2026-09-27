import { Temporal } from '@js-temporal/polyfill';
import { dashboardSchema } from '@study-platform/contracts';
import type { Dashboard } from '@study-platform/contracts';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { TasksService } from '../tasks/tasks.service.js';
import type { SubjectsService } from '../subjects/subjects.service.js';
import type { PomodoroService } from '../pomodoro/pomodoro.service.js';
import type { ReviewsService } from '../flashcards/reviews.service.js';
import type { StudyProgressService } from '../study-progress/study-progress.service.js';
import type { AnalyticsService } from '../analytics/analytics.service.js';
export interface DashboardSources {
  preferences: Pick<PreferencesService, 'read'>;
  tasks: Pick<TasksService, 'dashboardSummary'>;
  subjects: Pick<SubjectsService, 'dashboardSummary'>;
  pomodoro: Pick<PomodoroService, 'dashboardSummary'>;
  reviews: Pick<ReviewsService, 'pending'>;
  progress: Pick<StudyProgressService, 'read' | 'settings'>;
  analytics: Pick<AnalyticsService, 'read'>;
}
export class DashboardService {
  constructor(
    private readonly sources: DashboardSources,
    private readonly clock: () => Date = () => new Date(),
    private readonly timeoutMs = 5000,
  ) {}
  private async bounded<T>(work: () => Promise<T>) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        Promise.resolve().then(work),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Section timeout')),
            this.timeoutMs,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  private async section<T>(
    work: () => Promise<T>,
    empty: (data: T) => boolean,
  ) {
    try {
      const data = await this.bounded(work);
      return {
        state: empty(data) ? ('empty' as const) : ('ready' as const),
        data,
      };
    } catch {
      return {
        state: 'error' as const,
        message: 'Não foi possível carregar este resumo. Tente novamente.',
      };
    }
  }
  async read(userId: string): Promise<Dashboard> {
    const preferences = await this.sources.preferences.read(userId);
    const now = this.clock();
    const zone = this.bounded(() => this.sources.progress.settings(userId))
      .then((value) => value.timeZone)
      .catch(() => null);
    const [tasks, subjects, flashcards, pomodoro, streak, week, timeZone] =
      await Promise.all([
        preferences.tasks
          ? this.section(
              () => this.sources.tasks.dashboardSummary(userId),
              (data) =>
                Object.values(data.counts).every((value) => value === 0),
            )
          : undefined,
        preferences.subjects
          ? this.section(
              () => this.sources.subjects.dashboardSummary(userId),
              (data) => data === null,
            )
          : undefined,
        preferences.flashcards
          ? this.section(
              async () => ({
                pending: (
                  await this.sources.reviews.pending(userId, {
                    page: 1,
                    pageSize: 1,
                  })
                ).total,
              }),
              (data) => data.pending === 0,
            )
          : undefined,
        this.section(
          () => this.sources.pomodoro.dashboardSummary(userId),
          (data) => !data.session && data.completedSessions === 0,
        ),
        this.section(
          () => this.sources.progress.read(userId),
          (data) => data.activeDays === 0,
        ),
        this.section(
          async () => {
            const timeZone = await zone;
            if (!timeZone) throw new Error('Timezone unavailable');
            const date = Temporal.Instant.fromEpochMilliseconds(now.getTime())
              .toZonedDateTimeISO(timeZone)
              .toPlainDate()
              .toString();
            return this.sources.analytics.read(userId, {
              granularity: 'week',
              date,
              timeZone,
            });
          },
          (data) =>
            data.frequency.status === 'available' &&
            data.frequency.activeDays === 0,
        ),
        zone,
      ]);
    return dashboardSchema.parse({
      asOf: now.toISOString(),
      preferences,
      timeZone,
      ...(tasks ? { tasks } : {}),
      ...(subjects ? { subjects } : {}),
      ...(flashcards ? { flashcards } : {}),
      pomodoro,
      streak,
      week,
    });
  }
}
