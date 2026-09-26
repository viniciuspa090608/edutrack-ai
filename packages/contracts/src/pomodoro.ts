import { z } from 'zod';

export const startPomodoroSchema = z
  .object({ taskId: z.uuid().optional() })
  .strict();
export const pomodoroCommandSchema = z
  .object({ version: z.number().int().nonnegative() })
  .strict();
export const pomodoroActionSchema = z.enum([
  'pause',
  'resume',
  'next-block',
  'cancel',
  'complete',
]);
export const pomodoroPageSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const pomodoroSessionSchema = z
  .object({
    id: z.uuid(),
    taskId: z.uuid().nullable(),
    state: z.enum([
      'RUNNING',
      'PAUSED',
      'BETWEEN_BLOCKS',
      'COMPLETED',
      'CANCELED',
    ]),
    activeSeconds: z.number().int().nonnegative(),
    completedBlocks: z.number().int().nonnegative(),
    remainingSeconds: z.number().int().min(0).max(1500),
    version: z.number().int().nonnegative(),
    startedAt: z.iso.datetime(),
    endedAt: z.iso.datetime().nullable(),
    serverTime: z.iso.datetime(),
  })
  .strict();
export const currentPomodoroSchema = z
  .object({ session: pomodoroSessionSchema.nullable() })
  .strict();
export const pomodoroHistorySchema = z
  .object({
    items: z.array(pomodoroSessionSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const pomodoroSummarySchema = z
  .object({
    activeSeconds: z.number().int().nonnegative(),
    completedBlocks: z.number().int().nonnegative(),
  })
  .strict();
export const pomodoroConflictSchema = z
  .object({
    error: z.object({
      code: z.literal('POMODORO_CONFLICT'),
      message: z.string(),
    }),
    session: pomodoroSessionSchema,
  })
  .strict();
export type PomodoroSession = z.infer<typeof pomodoroSessionSchema>;
export type PomodoroAction = z.infer<typeof pomodoroActionSchema>;
export type StartPomodoro = z.infer<typeof startPomodoroSchema>;
export type PomodoroCommand = z.infer<typeof pomodoroCommandSchema>;
export type PomodoroState = PomodoroSession['state'];
export type CurrentPomodoro = z.infer<typeof currentPomodoroSchema>;
export type PomodoroHistory = z.infer<typeof pomodoroHistorySchema>;
export type PomodoroSummary = z.infer<typeof pomodoroSummarySchema>;
export type PomodoroPage = z.infer<typeof pomodoroPageSchema>;
