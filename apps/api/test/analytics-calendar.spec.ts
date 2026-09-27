import { expect, it } from 'vitest';
import { calendarPeriod, midnight } from '../src/modules/analytics/calendar.js';
it('uses ISO weeks and adjacent calendar periods across years', () => {
  for (const [granularity, start, previous] of [
    ['week', '2025-12-29', '2025-12-22'],
    ['quarter', '2026-01-01', '2025-10-01'],
    ['semester', '2026-01-01', '2025-07-01'],
    ['year', '2026-01-01', '2025-01-01'],
  ] as const) {
    const query = { granularity, date: '2026-01-01', timeZone: 'UTC' };
    expect(calendarPeriod(query).start.toString()).toBe(start);
    expect(calendarPeriod(query, true).start.toString()).toBe(previous);
    expect(calendarPeriod(query, true).end.toString()).toBe(start);
  }
});
it('preserves 23 and 25 hour days and midnight gaps', () => {
  for (const [date, zone, hours] of [
    ['2026-03-08', 'America/New_York', 23],
    ['2026-11-01', 'America/New_York', 25],
    ['2018-11-04', 'America/Sao_Paulo', 23],
  ] as const) {
    const { start, end } = calendarPeriod({
      granularity: 'day',
      date,
      timeZone: zone,
    });
    expect(
      (midnight(end, zone).getTime() - midnight(start, zone).getTime()) /
        3600000,
    ).toBe(hours);
  }
});
