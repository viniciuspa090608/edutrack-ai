import { z } from 'zod';

export const goalIndicatorSchema = z.enum([
  'tasks',
  'studyHours',
  'reviewAccuracy',
]);
export const subjectGoalInputSchema = z
  .object({
    indicator: goalIndicatorSchema,
    target: z.number().min(0.01).max(100000).multipleOf(0.01),
    dueDate: z.iso.date(),
    timeZone: z
      .string()
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('en', { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.indicator === 'tasks' && !Number.isInteger(value.target))
      ctx.addIssue({
        code: 'custom',
        path: ['target'],
        message: 'Use uma quantidade inteira de tarefas.',
      });
    if (value.indicator === 'reviewAccuracy' && value.target > 100)
      ctx.addIssue({
        code: 'custom',
        path: ['target'],
        message: 'Use um percentual até 100.',
      });
  });
export const subjectGoalSchema = z.object({
  ...subjectGoalInputSchema.shape,
  startedAt: z.iso.datetime(),
});
export const subjectInsightSchema = z.object({
  code: z.string(),
  information: z.string(),
  evidence: z.string(),
  suggestion: z.string(),
  action: z
    .object({ label: z.string(), href: z.string().startsWith('/app/') })
    .nullable(),
});
export const subjectInsightsSchema = z.object({
  goal: subjectGoalSchema.nullable(),
  availableIndicators: z.array(goalIndicatorSchema),
  progress: z
    .object({
      current: z.number().nonnegative().nullable(),
      percent: z.number().min(0).max(100).nullable(),
      remaining: z.number().nonnegative().nullable(),
      daysLeft: z.number().int().nonnegative(),
      state: z.enum([
        'active',
        'no_progress',
        'no_data',
        'expired',
        'achieved',
        'unavailable',
      ]),
      currentPerDay: z.number().nonnegative().nullable(),
      requiredPerDay: z.number().nonnegative().nullable(),
      observedDays: z.number().nonnegative(),
    })
    .nullable(),
  insights: z.array(subjectInsightSchema),
  calculatedAt: z.iso.datetime(),
});
export type GoalIndicator = z.infer<typeof goalIndicatorSchema>;
export type SubjectGoalInput = z.infer<typeof subjectGoalInputSchema>;
export type SubjectGoal = z.infer<typeof subjectGoalSchema>;
export type SubjectInsights = z.infer<typeof subjectInsightsSchema>;
export type SubjectInsight = z.infer<typeof subjectInsightSchema>;
