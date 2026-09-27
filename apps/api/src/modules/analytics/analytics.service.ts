import { Temporal } from '@js-temporal/polyfill';
import {
  analyticsQuerySchema,
  studyAnalyticsSchema,
} from '@study-platform/contracts';
import type {
  AnalyticsMetric,
  AnalyticsQuery,
  StudyAnalytics,
} from '@study-platform/contracts';
import type { DataSource, EntityManager } from 'typeorm';
import type { PreferencesService } from '../preferences/preferences.service.js';
import { terminalIntervals } from '../pomodoro/pomodoro-activity.js';
import { HttpError } from '../../shared/http-error.js';
import { calendarPeriod, localDate, midnight } from './calendar.js';
const kinds: Record<string, AnalyticsMetric> = {
  TASK_COMPLETED: 'tasks',
  FLASHCARD_REVIEWED: 'reviews',
  SUBJECT_PLAN_ITEM_COMPLETED: 'planItems',
  ROADMAP_BLOCK_COMPLETED: 'roadmapBlocks',
  POMODORO_SESSION_COMPLETED: 'pomodoroSessions',
};
export class AnalyticsService {
  constructor(
    private readonly source: DataSource,
    private readonly prefs: Pick<PreferencesService, 'read'>,
    private readonly clock: () => Date = () => new Date(),
  ) {}
  async read(userId: string, input: unknown): Promise<StudyAnalytics> {
    const parsed = analyticsQuerySchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Revise período, data e fuso.');
    const query = parsed.data;
    const preferences = await this.prefs.read(userId);
    const metrics: AnalyticsMetric[] = ['activeMs', 'pomodoroSessions'];
    if (preferences.tasks) metrics.push('tasks');
    if (preferences.flashcards) metrics.push('reviews');
    if (preferences.subjects) metrics.push('planItems', 'roadmapBlocks');
    return this.source.transaction(async (manager) => {
      const coverageRows = await manager.query<
        Array<{ metric: AnalyticsMetric; started_at: Date }>
      >('SELECT metric,started_at FROM study_analytics_coverage');
      const coverage = new Map(
        coverageRows.map((row) => [row.metric, row.started_at]),
      );
      const now = this.clock();
      const current = await this.aggregate(
        manager,
        userId,
        query,
        metrics,
        coverage,
        now,
        false,
      );
      const previous = await this.aggregate(
        manager,
        userId,
        query,
        metrics,
        coverage,
        now,
        true,
      );
      const comparisons: StudyAnalytics['metrics'] = {};
      for (const metric of metrics) {
        const value = current.available[metric]
          ? current.totals[metric]!
          : null;
        const before = previous.available[metric]
          ? previous.totals[metric]!
          : null;
        comparisons[metric] = {
          current: value,
          previous: before,
          difference: value !== null && before !== null ? value - before : null,
          percent:
            value !== null && before !== null && before > 0
              ? ((value - before) / before) * 100
              : null,
          coverageStart: coverage.get(metric)!.toISOString(),
          currentStatus: value === null ? 'history_unavailable' : 'available',
          previousStatus: before === null ? 'history_unavailable' : 'available',
        };
      }
      return studyAnalyticsSchema.parse({
        timeZone: query.timeZone,
        period: current.period,
        previousPeriod: previous.period,
        metrics: comparisons,
        series: current.series,
        frequency: {
          activeDays: current.active.size,
          days: current.period.days,
          status: metrics.every((metric) => current.available[metric])
            ? 'available'
            : 'history_unavailable',
        },
      });
    });
  }
  private async aggregate(
    manager: EntityManager,
    userId: string,
    query: AnalyticsQuery,
    metrics: AnalyticsMetric[],
    coverage: Map<AnalyticsMetric, Date>,
    now: Date,
    previous: boolean,
  ) {
    const { start, end } = calendarPeriod(query, previous);
    const begin = midnight(start, query.timeZone),
      finish = midnight(end, query.timeZone);
    const cutoff = new Date(Math.min(finish.getTime(), now.getTime()));
    const today = localDate(now, query.timeZone);
    const partial = begin <= now && now < finish;
    const totals: Partial<Record<AnalyticsMetric, number>> = Object.fromEntries(
      metrics.map((metric) => [metric, 0]),
    );
    const available: Partial<Record<AnalyticsMetric, boolean>> =
      Object.fromEntries(
        metrics.map((metric) => [metric, begin >= coverage.get(metric)!]),
      );
    const series: StudyAnalytics['series'] = [];
    const buckets = new Map<string, StudyAnalytics['series'][number]>();
    for (
      let day = start;
      Temporal.PlainDate.compare(day, end) < 0 &&
      Temporal.PlainDate.compare(day, today) <= 0;
      day = day.add({ days: 1 })
    ) {
      const bucket = {
        date: day.toString(),
        values: Object.fromEntries(
          metrics
            .filter(
              (metric) =>
                midnight(day, query.timeZone) >= coverage.get(metric)!,
            )
            .map((metric) => [metric, 0]),
        ),
      };
      series.push(bucket);
      buckets.set(bucket.date, bucket);
    }
    const active = new Set<string>();
    const add = (date: string, metric: AnalyticsMetric, amount: number) => {
      if (!metrics.includes(metric) || amount <= 0) return;
      totals[metric] = totals[metric]! + amount;
      const bucket = buckets.get(date);
      // An observed sample is valid even where completeness of historical coverage is unknown.
      if (bucket) bucket.values[metric] = (bucket.values[metric] ?? 0) + amount;
      if (metric !== 'pomodoroSessions') active.add(date);
    };
    const events = await manager.query<
      Array<{ kind: string; occurred_at: Date }>
    >(
      'SELECT kind,occurred_at FROM study_activity_events WHERE user_id=? AND occurred_at>=? AND occurred_at<? AND occurred_at<=?',
      [userId, begin, finish, now],
    );
    for (const event of events) {
      const metric = kinds[event.kind];
      if (metric)
        add(localDate(event.occurred_at, query.timeZone).toString(), metric, 1);
    }
    for (const interval of await terminalIntervals(
      manager,
      userId,
      begin,
      cutoff,
    )) {
      const from = new Date(
        Math.max(begin.getTime(), interval.started_at.getTime()),
      );
      const until = new Date(
        Math.min(cutoff.getTime(), interval.ended_at.getTime()),
      );
      for (
        let day = localDate(from, query.timeZone);
        midnight(day, query.timeZone) < until;
        day = day.add({ days: 1 })
      ) {
        const left = Math.max(
          from.getTime(),
          midnight(day, query.timeZone).getTime(),
        );
        const right = Math.min(
          until.getTime(),
          midnight(day.add({ days: 1 }), query.timeZone).getTime(),
        );
        add(day.toString(), 'activeMs', Math.max(0, right - left));
      }
    }
    return {
      totals,
      available,
      series,
      active,
      period: {
        start: start.toString(),
        end: end.toString(),
        partial,
        days: series.length,
      },
    };
  }
}
