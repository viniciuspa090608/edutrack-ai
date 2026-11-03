import { z } from 'zod';
import { createSubjectSchema } from './subjects.js';
import { createTaskSchema } from './tasks.js';

// Google identifiers are opaque strings, never local record identifiers.
export const classroomExternalIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^[A-Za-z0-9_-]+$/);
export const classroomLinkSchema = z
  .url()
  .max(2048)
  .refine(
    (value) => new URL(value).protocol === 'https:',
    'Use um link HTTPS.',
  );
export const classroomCourseSchema = z
  .object({
    id: classroomExternalIdSchema,
    name: z.string().min(1).max(1000),
    section: z.string().max(1000).nullable(),
    link: classroomLinkSchema.nullable(),
    state: z.string().max(40),
  })
  .strict();
export const classroomCoursesSchema = z
  .object({
    items: z.array(classroomCourseSchema).max(100),
    nextPageToken: z.string().max(4096).nullable(),
  })
  .strict();
export const classroomConnectionSchema = z
  .object({
    available: z.boolean(),
    state: z.enum(['disconnected', 'connected', 'reconnect_required']),
    account: z
      .object({ subject: classroomExternalIdSchema, email: z.email() })
      .strict()
      .nullable(),
    permissions: z
      .object({
        courses: z.boolean(),
        coursework: z.boolean(),
        teacherCoursework: z.boolean(),
      })
      .strict(),
    version: z.number().int().nonnegative(),
  })
  .strict();
export const classroomConsentSchema = z
  .object({
    purpose: z.enum(['import', 'teacher']),
  })
  .strict();
export const classroomAuthorizationSchema = z
  .object({ url: classroomLinkSchema })
  .strict();
export const classroomRevocationSchema = z
  .object({ revocationConfirmed: z.boolean() })
  .strict();
export const classroomDestinationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }).strict(),
  z.object({ kind: z.literal('existing'), subjectId: z.uuid() }).strict(),
  z.object({ kind: z.literal('new'), subject: createSubjectSchema }).strict(),
]);
export const classroomSelectionSchema = z
  .object({
    courses: z
      .array(
        z
          .object({
            courseId: classroomExternalIdSchema,
            destination: classroomDestinationSchema,
            confirmDestinationChange: z.boolean().default(false),
            linkExistingTasks: z.boolean().default(false),
            restoreDeleted: z.boolean().default(false),
          })
          .strict(),
      )
      .max(100)
      .refine(
        (courses) =>
          new Set(courses.map((course) => course.courseId)).size ===
          courses.length,
        'Selecione cada turma apenas uma vez.',
      ),
  })
  .strict();
export const classroomPaginationSchema = z
  .object({
    page: z.coerce.number().int().positive().max(1000000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export const classroomStartOperationSchema = z
  .object({
    requestId: z.uuid(),
    restoreDeleted: z.boolean().default(false),
    courseIds: z
      .array(classroomExternalIdSchema)
      .min(1)
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, 'Não repita turmas.'),
  })
  .strict();
export const classroomOperationStateSchema = z.enum([
  'queued',
  'running',
  'completed',
  'partial',
  'failed',
  'cancelled',
]);
export const classroomOutcomeSchema = z.enum([
  'added',
  'updated',
  'unchanged',
  'ignored',
  'conflict',
  'error',
]);
export const classroomCountsSchema = z
  .object({
    added: z.number().int().nonnegative(),
    updated: z.number().int().nonnegative(),
    unchanged: z.number().int().nonnegative(),
    ignored: z.number().int().nonnegative(),
    conflict: z.number().int().nonnegative(),
    error: z.number().int().nonnegative(),
  })
  .strict();
export const classroomOperationSchema = z
  .object({
    id: z.uuid(),
    kind: z.literal('import'),
    state: classroomOperationStateSchema,
    phase: z.enum(['queued', 'discovering', 'importing', 'finished']),
    processed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative().nullable(),
    counts: z
      .object({
        subjects: classroomCountsSchema,
        tasks: classroomCountsSchema,
      })
      .strict(),
    message: z.string().max(1000).nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const classroomOperationItemSchema = z
  .object({
    id: z.uuid(),
    entity: z.enum(['subject', 'task', 'course']),
    externalId: classroomExternalIdSchema,
    courseId: classroomExternalIdSchema,
    title: z.string().max(1000),
    outcome: classroomOutcomeSchema,
    reason: z.string().max(1000).nullable(),
    localId: z.uuid().nullable(),
    conflictId: z.uuid().nullable(),
  })
  .strict();
export const classroomOperationResultSchema = z
  .object({
    operation: classroomOperationSchema,
    items: z.array(classroomOperationItemSchema),
    page: z.number().int().positive(),
    totalItems: z.number().int().nonnegative(),
  })
  .strict();
export const classroomSourceSchema = z
  .object({
    googleSubject: classroomExternalIdSchema,
    courseId: classroomExternalIdSchema,
    itemId: classroomExternalIdSchema,
    courseName: z.string().max(1000),
    link: classroomLinkSchema.nullable(),
    attachments: z
      .array(
        z
          .object({ title: z.string().max(1000), link: classroomLinkSchema })
          .strict(),
      )
      .max(100),
    originalDueDate: z.string().max(10).nullable(),
    originalDueTime: z.string().max(16).nullable(),
    dueAt: z.iso.datetime().nullable(),
    timeZone: z.string().max(100),
  })
  .strict();
export const classroomTaskImportSchema = z
  .object({
    receiptId: z.uuid(),
    connectionVersion: z.number().int().positive(),
    source: classroomSourceSchema,
    relinkSubject: z.boolean().default(false),
    task: createTaskSchema,
    restoreDeleted: z.literal(true).optional(),
  })
  .strict();
export const classroomSubjectImportSchema = z
  .object({
    receiptId: z.uuid(),
    connectionVersion: z.number().int().positive(),
    googleSubject: classroomExternalIdSchema,
    course: classroomCourseSchema,
    destination: classroomDestinationSchema,
    confirmDestinationChange: z.boolean().default(false),
    restoreDeleted: z.literal(true).optional(),
  })
  .strict();
export const classroomConflictSchema = z
  .object({
    id: z.uuid(),
    localId: z.uuid(),
    revision: z.number().int().positive(),
    fields: z
      .array(
        z
          .object({
            field: z.enum([
              'title',
              'description',
              'dueDate',
              'name',
              'subjectId',
            ]),
            local: z.string().nullable(),
            remote: z.string().nullable(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export const classroomResolveConflictSchema = z
  .object({
    revision: z.number().int().positive(),
    choice: z.enum(['keep_local', 'accept_remote']),
  })
  .strict();
export const classroomImportResultSchema = z
  .object({
    localId: z.uuid().nullable(),
    outcome: classroomOutcomeSchema,
    reason: z.string().max(1000).nullable(),
    conflict: classroomConflictSchema.nullable(),
  })
  .strict();
export const onboardingStateSchema = z
  .object({
    step: z.enum(['modules', 'classroom', 'completed']),
    version: z.literal(1),
  })
  .strict();
export const onboardingUpdateSchema = z
  .object({ step: z.enum(['classroom', 'completed']) })
  .strict();

export type ClassroomConnection = z.infer<typeof classroomConnectionSchema>;
export type ClassroomCourse = z.infer<typeof classroomCourseSchema>;
export type ClassroomSelection = z.infer<typeof classroomSelectionSchema>;
export type ClassroomOperation = z.infer<typeof classroomOperationSchema>;
export type ClassroomOperationItem = z.infer<
  typeof classroomOperationItemSchema
>;
export type ClassroomSource = z.infer<typeof classroomSourceSchema>;
export type ClassroomImportResult = z.infer<typeof classroomImportResultSchema>;
export type ClassroomTaskImport = z.infer<typeof classroomTaskImportSchema>;
export type ClassroomSubjectImport = z.infer<
  typeof classroomSubjectImportSchema
>;
