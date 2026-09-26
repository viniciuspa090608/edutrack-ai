import { createHash, randomUUID } from 'node:crypto';
import {
  completedBoundary,
  flattenRoadmap,
  sequenceDuplicates,
  sequenceBlocks,
  persistedRoadmapContentSchema,
} from '@study-platform/contracts';
import type {
  Roadmap,
  SequenceStep,
  RoadmapDraft,
  PersistedRoadmapContent,
  RegenerateSteps,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
export const revisionConflict = () =>
  new HttpError(
    409,
    'REVISION_CONFLICT',
    'O roadmap mudou. Atualize a versão e prepare uma nova prévia.',
  );
export const protectedError = () =>
  new HttpError(
    400,
    'PROTECTED_STEPS',
    'O trecho até o último passo concluído está protegido.',
  );
export function prefixHash(steps: SequenceStep[]) {
  return createHash('sha256')
    .update(
      JSON.stringify(
        steps.map((step) => [
          step.id,
          step.title,
          step.description,
          step.completed,
          step.blockTitle,
          step.blockDescription,
        ]),
      ),
    )
    .digest('hex');
}
export function validSequence(steps: SequenceStep[]) {
  const duplicates = sequenceDuplicates(steps);
  if (duplicates.length)
    throw new HttpError(
      400,
      'DUPLICATE_STEPS',
      `Corrija os passos repetidos: ${duplicates.slice(0, 3).join(', ')}.`,
    );
  const blocks = sequenceBlocks(steps);
  if (!persistedRoadmapContentSchema.shape.blocks.safeParse(blocks).success)
    throw new HttpError(
      400,
      'INVALID_SEQUENCE',
      'A sequência deve conter até 20 blocos e 20 passos por bloco.',
    );
  return blocks;
}
export function manualContent(
  current: Roadmap,
  input: RoadmapDraft,
): PersistedRoadmapContent {
  const existing = new Map(
    flattenRoadmap(current).map((step) => [step.id, step]),
  );
  const blocks = input.blocks.map((block) => ({
    ...block,
    steps: block.steps.map((step) => {
      if (step.id && !existing.has(step.id))
        throw new HttpError(
          400,
          'INVALID_STEP_ID',
          'Um passo não pertence à versão ativa.',
        );
      const previous = step.id ? existing.get(step.id) : undefined;
      if (
        step.completed !== undefined &&
        step.completed !== (previous?.completed ?? false)
      )
        throw new HttpError(
          400,
          'INVALID_PROGRESS',
          'Use a ação de progresso para concluir ou reabrir um passo.',
        );
      return {
        id: step.id ?? randomUUID(),
        title: step.title,
        description: step.description,
        completed: previous?.completed ?? false,
      };
    }),
  }));
  const content = {
    title: input.title,
    description: input.description,
    blocks,
  };
  const before = flattenRoadmap(current),
    after = flattenRoadmap(content),
    boundary = completedBoundary(before);
  if (
    prefixHash(before.slice(0, boundary)) !==
    prefixHash(after.slice(0, boundary))
  )
    throw protectedError();
  validSequence(after);
  return content;
}
export function regenerationAnchor(current: Roadmap, input: RegenerateSteps) {
  if (current.revision !== input.baseRevision) throw revisionConflict();
  const active = flattenRoadmap(current),
    boundary = completedBoundary(active),
    pending = active.slice(boundary);
  if (
    input.pendingOrder.length !== pending.length ||
    new Set(input.pendingOrder).size !== pending.length ||
    input.pendingOrder.some((id) => !pending.some((step) => step.id === id))
  )
    throw protectedError();
  const movedIndex = input.pendingOrder.indexOf(input.movedStepId);
  if (movedIndex < 0) throw protectedError();
  const ordered = [
    ...active.slice(0, boundary),
    ...input.pendingOrder.map((id) => pending.find((step) => step.id === id)!),
  ];
  return {
    prefix: ordered.slice(0, boundary + movedIndex + 1),
    suffix: ordered.slice(boundary + movedIndex + 1),
  };
}
