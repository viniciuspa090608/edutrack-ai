import { z } from 'zod';
import { calendarDateSchema } from './tasks.js';
import { subjectLevelSchema } from './subjects.js';
const textFields = {
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(1000),
};
export const roadmapStepSchema = z.object(textFields).strict();
export const roadmapBlockSchema = z
  .object({ ...textFields, steps: z.array(roadmapStepSchema).min(1).max(20) })
  .strict();
export const roadmapContentSchema = z
  .object({ ...textFields, blocks: z.array(roadmapBlockSchema).min(1).max(20) })
  .strict();
export const roadmapSchema = roadmapContentSchema
  .extend({
    id: z.uuid(),
    subjectId: z.uuid(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export const roadmapListSchema = z
  .object({
    items: z.array(roadmapSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const roadmapParametersSchema = z
  .object({
    currentLevel: subjectLevelSchema,
    objective: z.string().trim().min(1).max(500),
    dueDate: calendarDateSchema,
    weeklyHours: z.number().min(0.5).max(80),
    knownTopics: z.array(z.string().trim().min(1).max(120)).max(30),
  })
  .strict();
// UTC calendar date is shared by server and browser; no date-to-instant conversion.
export function generationParametersSchema(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const last = `${String(now.getUTCFullYear() + 5).padStart(4, '0')}${today.slice(4)}`;
  return roadmapParametersSchema.refine(
    (value) => value.dueDate > today && value.dueDate <= last,
    {
      path: ['dueDate'],
      message: 'Informe um prazo futuro de até cinco anos.',
    },
  );
}
export const roadmapPreviewSchema = z
  .object({
    subjectId: z.uuid(),
    parameters: roadmapParametersSchema,
    content: roadmapContentSchema,
    receipt: z.string().min(1).max(2048),
    expiresAt: z.iso.datetime(),
  })
  .strict();
export const confirmRoadmapSchema = z
  .object({
    confirm: z.literal(true),
    receipt: roadmapPreviewSchema.shape.receipt,
    content: roadmapContentSchema,
  })
  .strict();
export type RoadmapContent = z.infer<typeof roadmapContentSchema>;
export type Roadmap = z.infer<typeof roadmapSchema>;
export type RoadmapParameters = z.infer<typeof roadmapParametersSchema>;
export type RoadmapPreview = z.infer<typeof roadmapPreviewSchema>;
export type RoadmapList = z.infer<typeof roadmapListSchema>;
