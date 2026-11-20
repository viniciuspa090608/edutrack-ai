import { z } from 'zod';
import {
  calendarDateSchema,
  taskStatusSchema,
  subtaskOrderSchema,
} from './tasks.js';

export const subjectLevelSchema = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
]);
const fields = {
  name: z.string().trim().min(1).max(120),
  currentLevel: subjectLevelSchema,
  objective: z.string().trim().min(1).max(1000),
  dueDate: calendarDateSchema,
  weeklyHours: z
    .number()
    .positive()
    .max(168)
    .refine(
      (value) => Number.isInteger(value * 2),
      'Use intervalos de meia hora.',
    ),
  knownTopics: z
    .array(z.string().trim().min(1).max(160))
    .refine(
      (topics) =>
        new Set(topics.map((topic) => topic.toLowerCase())).size ===
        topics.length,
      'Não repita assuntos.',
    ),
};
export function defaultSubjectObjective(name: string) {
  return `Estudar e me aprimorar em ${name.trim()}`;
}
export function newSubjectDefaults(name = '', today = new Date()) {
  const target = new Date(today.getFullYear(), today.getMonth() + 7, 0);
  target.setDate(Math.min(today.getDate(), target.getDate()));
  const dueDate = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
  return {
    name,
    currentLevel: 'INTERMEDIATE' as const,
    objective: defaultSubjectObjective(name),
    dueDate,
    weeklyHours: 1,
    knownTopics: [] as string[],
  };
}
const subjectFieldsSchema = z.object(fields).strict();
export const subjectCreationFieldsSchema = z
  .object({
    ...fields,
    objective: z.string().trim().max(1000).default(''),
    weeklyHours: fields.weeklyHours.default(1),
    knownTopics: fields.knownTopics.default([]),
  })
  .strict();
export const createSubjectSchema = subjectCreationFieldsSchema.transform(
  (input) => ({
    ...input,
    objective: input.objective || defaultSubjectObjective(input.name),
  }),
);
export const updateSubjectSchema = subjectFieldsSchema
  .partial()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'Envie ao menos um campo.',
  );
export const subjectPaginationSchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .positive()
      .max(Number.MAX_SAFE_INTEGER)
      .default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const createPlanItemSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    status: taskStatusSchema.default('PENDING'),
  })
  .strict();
export const updatePlanItemSchema = createPlanItemSchema
  .partial()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'Envie ao menos um campo.',
  );
export const planOrderSchema = subtaskOrderSchema;
export const planItemSchema = z
  .object({
    id: z.uuid(),
    subjectId: z.uuid(),
    title: createPlanItemSchema.shape.title,
    status: taskStatusSchema,
    position: z.number().int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const subjectSchema = subjectFieldsSchema
  .extend({
    id: z.uuid(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    planItems: z.array(planItemSchema),
  })
  .strict();
export const subjectStudySummarySchema = z
  .object({
    source: z.enum(['roadmap', 'manual']),
    total: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    progressPercent: z.number().min(0).max(100).nullable(),
  })
  .strict();
export type SubjectStudySummary = z.infer<typeof subjectStudySummarySchema>;
export const subjectListSchema = z
  .object({
    items: z.array(
      subjectSchema.extend({ studySummary: subjectStudySummarySchema }),
    ),
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export type StudySubject = z.infer<typeof subjectSchema>;
export type CreateSubject = z.infer<typeof createSubjectSchema>;
export type UpdateSubject = z.infer<typeof updateSubjectSchema>;
export const subjectFiltersSchema = subjectPaginationSchema.extend({
  name: z.string().trim().max(160).optional(),
});
export type SubjectFilters = z.infer<typeof subjectFiltersSchema>;
export type SubjectPagination = z.infer<typeof subjectPaginationSchema>;
export type SubjectList = z.infer<typeof subjectListSchema>;
export type PlanItem = z.infer<typeof planItemSchema>;
export type UpdatePlanItem = z.infer<typeof updatePlanItemSchema>;
