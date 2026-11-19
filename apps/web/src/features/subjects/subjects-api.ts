import {
  dashboardSubjectsSchema,
  createSubjectSchema,
  updateSubjectSchema,
  subjectSchema,
  subjectListSchema,
  subjectFiltersSchema,
  createPlanItemSchema,
  updatePlanItemSchema,
  planOrderSchema,
} from '@study-platform/contracts';
import type { UpdateSubject } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
export async function listSubjects(page = 1, pageSize = 20, name?: string) {
  const query = subjectFiltersSchema.parse({ page, pageSize, name });
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.name) params.set('name', query.name);
  return subjectListSchema.parse(
    await (await send(`/subjects?${params}`)).json(),
  );
}
export async function subjectDetail(id: string) {
  return subjectSchema.parse(
    await (await send(`/subjects/${subjectSchema.shape.id.parse(id)}`)).json(),
  );
}
async function write(path: string, method: string, body: object) {
  return send(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
export async function saveSubject(id: string | null, input: UpdateSubject) {
  return subjectSchema.parse(
    await (
      await write(
        id ? `/subjects/${id}` : '/subjects',
        id ? 'PATCH' : 'POST',
        id
          ? updateSubjectSchema.parse(input)
          : createSubjectSchema.parse(input),
      )
    ).json(),
  );
}
export async function deleteSubject(id: string) {
  await write(`/subjects/${id}`, 'DELETE', {});
}
export async function mutatePlan(
  id: string,
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  input: object,
) {
  const body =
    method === 'POST'
      ? createPlanItemSchema.parse(input)
      : method === 'PATCH'
        ? updatePlanItemSchema.parse(input)
        : method === 'PUT'
          ? planOrderSchema.parse(input)
          : {};
  return subjectSchema.parse(
    await (
      await write(`/subjects/${id}/plan-items${path}`, method, body)
    ).json(),
  );
}

export async function dashboardSubjects(page: number) {
  return dashboardSubjectsSchema.parse(
    await (await send('/subjects/dashboard?page=' + page)).json(),
  );
}
