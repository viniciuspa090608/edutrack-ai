import { z } from 'zod';

export const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      value >= '1000-01-01' &&
      value <= '9999-12-31' &&
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, 'Informe uma data de calendário válida.');
const taskFields = {
  subjectId: z.uuid().nullable(),
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000).nullable(),
  priority: taskPrioritySchema,
  dueDate: calendarDateSchema.nullable(),
  status: taskStatusSchema,
};
export const createTaskSchema = z
  .object({
    ...taskFields,
    subjectId: taskFields.subjectId.optional().default(null),
    description: taskFields.description.optional().default(null),
    dueDate: taskFields.dueDate.optional().default(null),
    priority: taskPrioritySchema.default('MEDIUM'),
    status: taskStatusSchema.default('PENDING'),
  })
  .strict();
export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .strict()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'Envie ao menos um campo.',
  );
const pageNumber = z
  .union([
    z.number(),
    z
      .string()
      .regex(/^[1-9]\d*$/)
      .transform(Number),
  ])
  .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER));
export const taskFiltersSchema = z
  .object({
    subjectId: z.uuid().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueFrom: calendarDateSchema.optional(),
    dueTo: calendarDateSchema.optional(),
    page: pageNumber.default(1),
    pageSize: pageNumber.pipe(z.number().max(100)).default(20),
  })
  .strict()
  .refine(
    (input) => !input.dueFrom || !input.dueTo || input.dueFrom <= input.dueTo,
    'O prazo final deve ser igual ou posterior ao inicial.',
  );
export const taskSchema = z
  .object({
    id: z.uuid(),
    ...taskFields,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    subtaskTotal: z.number().int().nonnegative(),
    subtaskCompleted: z.number().int().nonnegative(),
    progressPercent: z.number().min(0).max(100).nullable(),
  })
  .strict();
export const taskListSchema = z
  .object({
    items: z.array(taskSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export type StudyTask = z.infer<typeof taskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type TaskList = z.infer<typeof taskListSchema>;

export const createSubtaskSchema = z
  .object({ title: taskFields.title })
  .strict();
export const updateSubtaskSchema = z
  .object({
    title: taskFields.title.optional(),
    isCompleted: z.boolean().optional(),
  })
  .strict()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'Envie ao menos um campo.',
  );
export const subtaskSchema = z
  .object({
    id: z.uuid(),
    taskId: z.uuid(),
    title: taskFields.title,
    isCompleted: z.boolean(),
    position: z.number().int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const subtaskOrderSchema = z
  .object({ ids: z.array(z.uuid()) })
  .strict()
  .refine(
    (input) => new Set(input.ids).size === input.ids.length,
    'Não repita IDs.',
  );
export const completeSubtasksSchema = z
  .object({ confirm: z.literal(true) })
  .strict();
export const subtasksResponseSchema = z
  .object({ items: z.array(subtaskSchema), task: taskSchema })
  .strict();
export type Subtask = z.infer<typeof subtaskSchema>;
export type UpdateSubtask = z.infer<typeof updateSubtaskSchema>;
export type SubtasksResponse = z.infer<typeof subtasksResponseSchema>;
