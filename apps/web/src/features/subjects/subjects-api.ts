import {
  createSubjectSchema,
  updateSubjectSchema,
  subjectSchema,
  subjectListSchema,
  subjectPaginationSchema,
  createPlanItemSchema,
  updatePlanItemSchema,
  planOrderSchema,
} from '@study-platform/contracts';
import type { UpdateSubject } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
export async function listSubjects(page = 1, pageSize = 20) {
  const query = subjectPaginationSchema.parse({ page, pageSize });
  return subjectListSchema.parse(
    await (
      await send(`/subjects?page=${query.page}&pageSize=${query.pageSize}`)
    ).json(),
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
