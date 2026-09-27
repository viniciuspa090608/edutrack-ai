import { z } from 'zod';
import { taskSchema, calendarDateSchema } from './tasks.js';
import { pomodoroSessionSchema } from './pomodoro.js';
import { studyProgressSchema, studyTimeZoneSchema } from './study-progress.js';
import { studyAnalyticsSchema } from './analytics.js';
const modulePreferencesSchema = z
  .object({
    tasks: z.boolean(),
    subjects: z.boolean(),
    flashcards: z.boolean(),
    ai: z.boolean(),
  })
  .strict();
const count = z.number().int().nonnegative();
export const dashboardTasksSchema = z
  .object({
    counts: z
      .object({ PENDING: count, IN_PROGRESS: count, COMPLETED: count })
      .strict(),
    upcoming: z.array(taskSchema).max(5),
    withoutDeadline: count,
  })
  .strict();
export const dashboardSubjectSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    dueDate: calendarDateSchema,
    hasPending: z.boolean(),
    source: z.enum(['manual', 'roadmap']),
    roadmapId: z.uuid().nullable(),
    title: z.string(),
    total: count,
    completed: count,
    progressPercent: z.number().min(0).max(100).nullable(),
  })
  .strict();
export const dashboardPomodoroSchema = z
  .object({
    session: pomodoroSessionSchema.nullable(),
    completedSessions: count,
  })
  .strict();
export function dashboardSectionSchema<T extends z.ZodType>(data: T) {
  return z.discriminatedUnion('state', [
    z.object({ state: z.literal('ready'), data }).strict(),
    z.object({ state: z.literal('empty'), data }).strict(),
    z
      .object({ state: z.literal('error'), message: z.string().min(1) })
      .strict(),
  ]);
}
export const dashboardSchema = z
  .object({
    asOf: z.iso.datetime(),
    timeZone: studyTimeZoneSchema.nullable(),
    preferences: modulePreferencesSchema,
    tasks: dashboardSectionSchema(dashboardTasksSchema).optional(),
    subjects: dashboardSectionSchema(
      dashboardSubjectSchema.nullable(),
    ).optional(),
    flashcards: dashboardSectionSchema(
      z.object({ pending: count }).strict(),
    ).optional(),
    pomodoro: dashboardSectionSchema(dashboardPomodoroSchema),
    streak: dashboardSectionSchema(studyProgressSchema),
    week: dashboardSectionSchema(studyAnalyticsSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const key of ['tasks', 'subjects', 'flashcards'] as const)
      if (!!value[key] !== value.preferences[key])
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'A seção deve corresponder à preferência do módulo.',
        });
  });
export type Dashboard = z.infer<typeof dashboardSchema>;
export type DashboardSubject = z.infer<typeof dashboardSubjectSchema>;
export type DashboardTasks = z.infer<typeof dashboardTasksSchema>;
export type DashboardPomodoro = z.infer<typeof dashboardPomodoroSchema>;
