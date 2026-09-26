import { z } from 'zod';

export const routineTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const routineTimeZoneSchema = z
  .string()
  .max(100)
  .refine((value) => {
    if (/^[+-]/.test(value)) return false;
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Fuso horário inválido.');
export const routineSlotSchema = z
  .object({
    weekday: z.number().int().min(1).max(7),
    startTime: routineTimeSchema,
    endTime: routineTimeSchema,
  })
  .strict()
  .refine(
    (slot) => slot.startTime < slot.endTime,
    'O início deve ser anterior ao fim no mesmo dia.',
  );
export const routineSlotsSchema = z
  .array(routineSlotSchema)
  .min(1)
  .superRefine((slots, ctx) => {
    const sorted = [...slots].sort(
      (a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime),
    );
    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1]!;
      const next = sorted[i]!;
      if (
        previous.weekday === next.weekday &&
        next.startTime < previous.endTime
      )
        ctx.addIssue({
          code: 'custom',
          message: 'Horários da mesma rotina não podem se sobrepor.',
        });
    }
  });
const fields = {
  name: z.string().trim().min(1).max(120),
  timeZone: routineTimeZoneSchema,
  slots: routineSlotsSchema,
};
export const createRoutineSchema = z.object(fields).strict();
export const updateRoutineSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    'Envie pelo menos um campo.',
  );
export const routineSchema = z
  .object({
    id: z.uuid(),
    ...fields,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const routinePaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const routineListSchema = z
  .object({
    items: z.array(routineSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const routineScheduleItemSchema = z
  .object({
    routineId: z.uuid(),
    name: fields.name,
    timeZone: routineTimeZoneSchema,
    ...routineSlotSchema.shape,
  })
  .strict();
export const routineScheduleSchema = z
  .object({ items: z.array(routineScheduleItemSchema) })
  .strict();
export type RoutineSlot = z.infer<typeof routineSlotSchema>;
export type StudyRoutine = z.infer<typeof routineSchema>;
export type CreateRoutine = z.infer<typeof createRoutineSchema>;
export type UpdateRoutine = z.infer<typeof updateRoutineSchema>;
export type RoutinePagination = z.infer<typeof routinePaginationSchema>;
export type RoutineList = z.infer<typeof routineListSchema>;
export type RoutineSchedule = z.infer<typeof routineScheduleSchema>;
