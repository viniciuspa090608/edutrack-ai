import { Temporal } from '@js-temporal/polyfill';
import type { AnalyticsQuery } from '@study-platform/contracts';
export function calendarPeriod(query: AnalyticsQuery, previous = false) {
  let start = Temporal.PlainDate.from(query.date);
  const size =
    query.granularity === 'quarter'
      ? 3
      : query.granularity === 'semester'
        ? 6
        : 12;
  if (query.granularity === 'week')
    start = start.subtract({ days: start.dayOfWeek - 1 });
  else if (query.granularity !== 'day')
    start = start.with({
      month: Math.floor((start.month - 1) / size) * size + 1,
      day: 1,
    });
  const duration =
    query.granularity === 'day'
      ? { days: 1 }
      : query.granularity === 'week'
        ? { days: 7 }
        : { months: size };
  if (previous) start = start.subtract(duration);
  const end = start.add(duration);
  return { start, end };
}
export function midnight(date: Temporal.PlainDate, zone: string) {
  return new Date(date.toZonedDateTime(zone).epochMilliseconds);
}
export function localDate(instant: Date, zone: string) {
  return Temporal.Instant.fromEpochMilliseconds(instant.getTime())
    .toZonedDateTimeISO(zone)
    .toPlainDate();
}
