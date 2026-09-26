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
export const createSubjectSchema = z.object(fields).strict();
export const updateSubjectSchema = createSubjectSchema
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
export const subjectSchema = createSubjectSchema
  .extend({
    id: z.uuid(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    planItems: z.array(planItemSchema),
  })
  .strict();
export const subjectListSchema = z
  .object({
    items: z.array(subjectSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export type StudySubject = z.infer<typeof subjectSchema>;
export type CreateSubject = z.infer<typeof createSubjectSchema>;
export type UpdateSubject = z.infer<typeof updateSubjectSchema>;
export type SubjectPagination = z.infer<typeof subjectPaginationSchema>;
export type SubjectList = z.infer<typeof subjectListSchema>;
export type PlanItem = z.infer<typeof planItemSchema>;
export type UpdatePlanItem = z.infer<typeof updatePlanItemSchema>;
