import { z } from 'zod';
import {
  persistedRoadmapContentSchema,
  persistedRoadmapStepSchema,
  roadmapStepSchema,
} from './roadmaps.js';
export const sequenceStepSchema = persistedRoadmapStepSchema
  .extend({
    blockTitle: roadmapStepSchema.shape.title,
    blockDescription: roadmapStepSchema.shape.description,
  })
  .strict();
export const sequenceSchema = z.array(sequenceStepSchema).min(1).max(400);
export const suffixSchema = z
  .object({ steps: z.array(roadmapStepSchema).min(1).max(400) })
  .strict();
export const revisionOriginSchema = z.enum(['manual', 'ia', 'restauracao']);
export const roadmapRevisionSchema = z
  .object({
    roadmapId: z.uuid(),
    revision: z.number().int().positive(),
    origin: revisionOriginSchema,
    sourceRevision: z.number().int().positive().nullable(),
    createdAt: z.iso.datetime(),
    content: persistedRoadmapContentSchema,
  })
  .strict();
export const revisionListSchema = z
  .object({
    items: z.array(roadmapRevisionSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(100),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();
export const regenerateStepsSchema = z
  .object({
    baseRevision: z.number().int().positive(),
    movedStepId: z.uuid(),
    pendingOrder: z.array(z.uuid()).min(1).max(400),
  })
  .strict();
export const restorationRequestSchema = z
  .object({
    baseRevision: z.number().int().positive(),
    sourceRevision: z.number().int().positive(),
  })
  .strict();
export const stepProgressSchema = z
  .object({ baseRevision: z.number().int().positive(), completed: z.boolean() })
  .strict();
export const revisionPreviewSchema = z
  .object({
    roadmapId: z.uuid(),
    baseRevision: z.number().int().positive(),
    preservedCount: z.number().int().min(0).max(400),
    steps: sequenceSchema,
    origin: z.enum(['ia', 'restauracao']),
    sourceRevision: z.number().int().positive().nullable(),
    warnings: z.array(z.string().max(500)).max(20),
    receipt: z.string().min(1).max(24576),
    idempotencyKey: z.uuid(),
    expiresAt: z.iso.datetime(),
  })
  .strict();
export const confirmRevisionSchema = z
  .object({
    confirm: z.literal(true),
    baseRevision: z.number().int().positive(),
    receipt: z.string().min(1).max(24576),
    idempotencyKey: z.uuid(),
    steps: sequenceSchema,
  })
  .strict();
export type SequenceStep = z.infer<typeof sequenceStepSchema>;
export type RoadmapRevision = z.infer<typeof roadmapRevisionSchema>;
export type RevisionPreview = z.infer<typeof revisionPreviewSchema>;
export type RegenerateSteps = z.infer<typeof regenerateStepsSchema>;
export type RevisionList = z.infer<typeof revisionListSchema>;
export function flattenRoadmap(
  content: z.infer<typeof persistedRoadmapContentSchema>,
): SequenceStep[] {
  return content.blocks.flatMap((block) =>
    block.steps.map((step) => ({
      ...step,
      blockTitle: block.title,
      blockDescription: block.description,
    })),
  );
}
export function completedBoundary(steps: SequenceStep[]) {
  return steps.reduce(
    (last, step, index) => (step.completed ? index + 1 : last),
    0,
  );
}
export function normalizedStepTitle(title: string) {
  return title
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('pt-BR');
}
export function sequenceDuplicates(steps: SequenceStep[]): string[] {
  const ids = new Set<string>(),
    titles = new Set<string>(),
    duplicates: string[] = [];
  for (const step of steps) {
    const title = normalizedStepTitle(step.title);
    if (ids.has(step.id) || titles.has(title)) duplicates.push(step.title);
    ids.add(step.id);
    titles.add(title);
  }
  return duplicates;
}
export function sequenceBlocks(steps: SequenceStep[]) {
  const blocks: Array<
    z.infer<typeof persistedRoadmapContentSchema>['blocks'][number]
  > = [];
  for (const step of steps) {
    let block = blocks.at(-1);
    if (
      !block ||
      block.title !== step.blockTitle ||
      block.description !== step.blockDescription ||
      block.steps.length === 20
    ) {
      block = {
        title: step.blockTitle,
        description: step.blockDescription,
        steps: [],
      };
      blocks.push(block);
    }
    block.steps.push({
      id: step.id,
      title: step.title,
      description: step.description,
      completed: step.completed,
    });
  }
  return blocks;
}
