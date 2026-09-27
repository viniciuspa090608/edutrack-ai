import { describe, expect, it } from 'vitest';
import { analyticsQuerySchema, studyAnalyticsSchema } from './analytics.js';
describe('study analytics contracts', () => {
  const query = {
    granularity: 'week',
    date: '2024-02-29',
    timeZone: 'America/Sao_Paulo',
  };
  it('validates civil dates, zones and granularity', () => {
    expect(analyticsQuerySchema.safeParse(query).success).toBe(true);
    for (const input of [
      { date: '2023-02-29' },
      { timeZone: 'Unknown/Zone' },
      { granularity: 'month' },
      { userId: 'another' },
      { timeZone: '+05:30' },
      { date: '0000-01-01' },
      { date: '9999-12-31' },
    ])
      expect(
        analyticsQuerySchema.safeParse({ ...query, ...input }).success,
      ).toBe(false);
  });
  it('preserves omitted modules and unavailable history', () => {
    const period = {
      start: '2026-01-01',
      end: '2026-01-02',
      partial: false,
      days: 1,
    };
    const data = studyAnalyticsSchema.parse({
      timeZone: 'UTC',
      period,
      previousPeriod: period,
      metrics: {},
      series: [{ date: period.start, values: {} }],
      frequency: { activeDays: 0, days: 1, status: 'history_unavailable' },
    });
    expect(data.metrics.tasks).toBeUndefined();
    expect(data.series[0]!.values.tasks).toBeUndefined();
  });
});
