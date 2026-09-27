import {
  analyticsQuerySchema,
  studyAnalyticsSchema,
} from '@study-platform/contracts';
import type { AnalyticsQuery } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
export async function studyAnalytics(input: AnalyticsQuery) {
  const params = new URLSearchParams(analyticsQuerySchema.parse(input));
  return studyAnalyticsSchema.parse(
    await (await send(`/analytics/study?${params}`)).json(),
  );
}
