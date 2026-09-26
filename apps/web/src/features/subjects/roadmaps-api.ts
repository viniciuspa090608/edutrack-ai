import {
  roadmapContentSchema,
  roadmapSchema,
  roadmapListSchema,
  roadmapPreviewSchema,
  generationParametersSchema,
  confirmRoadmapSchema,
} from '@study-platform/contracts';
import type {
  RoadmapContent,
  RoadmapParameters,
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
  content: RoadmapContent,
) {
  return roadmapSchema.parse(
    await (
      await write(
        `/subjects/${subjectId}/roadmaps${id ? `/${id}` : ''}`,
        id ? 'PATCH' : 'POST',
        roadmapContentSchema.parse(content),
      )
    ).json(),
  );
}
export async function deleteRoadmap(subjectId: string, id: string) {
  await write(`/subjects/${subjectId}/roadmaps/${id}`, 'DELETE', {});
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
