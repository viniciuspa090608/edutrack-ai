import type { AnalyticsQuery } from '@study-platform/contracts';
export function analyticsDefaults(): AnalyticsQuery {
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    /* Identified UTC fallback below. */
  }
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return { granularity: 'week', date, timeZone };
}

let owner: string | null = null;
let query: AnalyticsQuery | null = null;
export function setReportOwner(id: string | null) {
  if (owner !== id) {
    owner = id;
    query = null;
  }
}
export function appliedAnalyticsQuery() {
  return query;
}
export function applyAnalyticsQuery(value: AnalyticsQuery) {
  query = value;
  window.dispatchEvent(new Event('edutrack:report-query'));
}
