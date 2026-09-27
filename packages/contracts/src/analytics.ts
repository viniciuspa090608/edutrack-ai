import { z } from 'zod';

export const analyticsDateSchema = z.iso.date();
export const analyticsQuerySchema = z
  .object({
    granularity: z.enum(['day', 'week', 'quarter', 'semester', 'year']),
    date: analyticsDateSchema.refine(
      (date) => date >= '0001-01-01' && date <= '9998-12-31',
      'Data fora do intervalo suportado',
    ),
    timeZone: z
      .string()
      .min(1)
      .max(100)
      .refine((value) => {
        if (/^[+-]/.test(value)) return false;
        try {
          new Intl.DateTimeFormat('en', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, 'Fuso inválido'),
  })
  .strict();
export const analyticsMetricSchema = z.enum([
  'activeMs',
  'pomodoroSessions',
  'tasks',
  'reviews',
  'planItems',
  'roadmapBlocks',
]);
const valuesSchema = z.partialRecord(
  analyticsMetricSchema,
  z.number().nonnegative(),
);
const periodSchema = z.object({
  start: analyticsDateSchema,
  end: analyticsDateSchema,
  partial: z.boolean(),
  days: z.number().int().nonnegative(),
});
const comparisonSchema = z.object({
  current: z.number().nonnegative().nullable(),
  previous: z.number().nonnegative().nullable(),
  difference: z.number().nullable(),
  percent: z.number().nullable(),
  coverageStart: z.iso.datetime(),
  currentStatus: z.enum(['available', 'history_unavailable']),
  previousStatus: z.enum(['available', 'history_unavailable']),
});
export const studyAnalyticsSchema = z.object({
  timeZone: z.string(),
  period: periodSchema,
  previousPeriod: periodSchema,
  metrics: z.partialRecord(analyticsMetricSchema, comparisonSchema),
  series: z.array(
    z.object({ date: analyticsDateSchema, values: valuesSchema }),
  ),
  frequency: z.object({
    activeDays: z.number().int().nonnegative(),
    days: z.number().int().nonnegative(),
    status: z.enum(['available', 'history_unavailable']),
  }),
});
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsMetric = z.infer<typeof analyticsMetricSchema>;
export type StudyAnalytics = z.infer<typeof studyAnalyticsSchema>;
