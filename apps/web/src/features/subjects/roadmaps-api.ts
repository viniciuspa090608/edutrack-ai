import {
  roadmapContentSchema,
  roadmapSchema,
  roadmapListSchema,
  roadmapPreviewSchema,
  generationParametersSchema,
  confirmRoadmapSchema,
  updateRoadmapSchema,
  stepProgressSchema,
  revisionListSchema,
  roadmapRevisionSchema,
  revisionPreviewSchema,
  regenerateStepsSchema,
  restorationRequestSchema,
  confirmRevisionSchema,
} from '@study-platform/contracts';
import type {
  RoadmapContent,
  RoadmapParameters,
  RoadmapDraft,
  RevisionPreview,
  SequenceStep,
  RegenerateSteps,
} from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
async function write(
  path: string,
  method: string,
  input: unknown,
  signal?: AbortSignal,
) {
  return send(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    ...(signal ? { signal } : {}),
  });
}
export async function listRoadmaps(subjectId: string, page = 1) {
  return roadmapListSchema.parse(
    await (
      await send(`/subjects/${subjectId}/roadmaps?page=${page}&pageSize=20`)
    ).json(),
  );
}
export async function saveRoadmap(
  subjectId: string,
  id: string | null,
  content: RoadmapDraft,
  baseRevision?: number,
) {
  return roadmapSchema.parse(
    await (
      await write(
        `/subjects/${subjectId}/roadmaps${id ? `/${id}` : ''}`,
        id ? 'PATCH' : 'POST',
        id
          ? updateRoadmapSchema.parse({ ...content, baseRevision })
          : roadmapContentSchema.parse(content),
      )
    ).json(),
  );
}
export async function deleteRoadmap(subjectId: string, id: string) {
  await write(`/subjects/${subjectId}/roadmaps/${id}`, 'DELETE', {});
}
const revisionPath = (subjectId: string, id: string) =>
  `/subjects/${subjectId}/roadmaps/${id}`;
export async function roadmapHistory(subjectId: string, id: string, page = 1) {
  return revisionListSchema.parse(
    await (
      await send(
        `${revisionPath(subjectId, id)}/revisions?page=${page}&pageSize=10`,
      )
    ).json(),
  );
}
export async function roadmapRevision(
  subjectId: string,
  id: string,
  revision: number,
) {
  return roadmapRevisionSchema.parse(
    await (
      await send(`${revisionPath(subjectId, id)}/revisions/${revision}`)
    ).json(),
  );
}
export async function changeStepProgress(
  subjectId: string,
  id: string,
  stepId: string,
  baseRevision: number,
  completed: boolean,
) {
  return roadmapSchema.parse(
    await (
      await write(
        `${revisionPath(subjectId, id)}/steps/${stepId}`,
        'PATCH',
        stepProgressSchema.parse({ baseRevision, completed }),
      )
    ).json(),
  );
}
export async function regenerateSteps(
  subjectId: string,
  id: string,
  input: RegenerateSteps,
  signal: AbortSignal,
) {
  return revisionPreviewSchema.parse(
    await (
      await write(
        `${revisionPath(subjectId, id)}/step-regenerations`,
        'POST',
        regenerateStepsSchema.parse(input),
        signal,
      )
    ).json(),
  );
}
export async function restoreRevision(
  subjectId: string,
  id: string,
  baseRevision: number,
  sourceRevision: number,
  signal: AbortSignal,
) {
  return revisionPreviewSchema.parse(
    await (
      await write(
        `${revisionPath(subjectId, id)}/restoration-previews`,
        'POST',
        restorationRequestSchema.parse({ baseRevision, sourceRevision }),
        signal,
      )
    ).json(),
  );
}
export async function confirmRevision(
  subjectId: string,
  id: string,
  preview: RevisionPreview,
  steps: SequenceStep[],
) {
  return roadmapRevisionSchema.parse(
    await (
      await write(
        `${revisionPath(subjectId, id)}/revision-confirmations`,
        'POST',
        confirmRevisionSchema.parse({
          confirm: true,
          baseRevision: preview.baseRevision,
          idempotencyKey: preview.idempotencyKey,
          receipt: preview.receipt,
          steps,
        }),
      )
    ).json(),
  );
}
export async function generateRoadmap(
  subjectId: string,
  parameters: RoadmapParameters,
  signal: AbortSignal,
) {
  const preview = roadmapPreviewSchema.parse(
    await (
      await write(
        `/subjects/${subjectId}/roadmap-generations`,
        'POST',
        generationParametersSchema().parse(parameters),
        signal,
      )
    ).json(),
  );
  if (preview.subjectId !== subjectId)
    throw new Error('Invalid preview subject');
  return preview;
}
export async function confirmRoadmap(
  subjectId: string,
  receipt: string,
  content: RoadmapContent,
) {
  return roadmapSchema.parse(
    await (
      await write(
        `/subjects/${subjectId}/roadmaps/confirm-ai`,
        'POST',
        confirmRoadmapSchema.parse({ confirm: true, receipt, content }),
      )
    ).json(),
  );
}
