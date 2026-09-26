import {
  createTaskSchema,
  taskFiltersSchema,
  taskListSchema,
  taskSchema,
  updateTaskSchema,
  subtasksResponseSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  subtaskOrderSchema,
  completeSubtasksSchema,
} from '@study-platform/contracts';
import type { TaskFilters, UpdateTask } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';

export async function listTasks(filters: TaskFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(taskFiltersSchema.parse(filters)))
    if (value !== undefined) params.set(key, String(value));
  return taskListSchema.parse(await (await send(`/tasks?${params}`)).json());
}
export async function taskDetail(id: string) {
  return taskSchema.parse(await (await send(`/tasks/${id}`)).json());
}
export async function saveTask(id: string | null, input: UpdateTask) {
  const body = id
    ? updateTaskSchema.parse(input)
    : createTaskSchema.parse(input);
  return taskSchema.parse(
    await (
      await send(id ? `/tasks/${id}` : '/tasks', {
        method: id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    ).json(),
  );
}
export async function deleteTask(id: string) {
  await send(`/tasks/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}
export async function listSubtasks(taskId: string) {
  return subtasksResponseSchema.parse(
    await (await send(`/tasks/${taskId}/subtasks`)).json(),
  );
}
export async function mutateSubtask(
  taskId: string,
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body: object,
) {
  const input =
    path === '/complete-subtasks'
      ? completeSubtasksSchema.parse(body)
      : path === '/subtasks/order'
        ? subtaskOrderSchema.parse(body)
        : method === 'POST'
          ? createSubtaskSchema.parse(body)
          : method === 'PATCH'
            ? updateSubtaskSchema.parse(body)
            : {};
  return subtasksResponseSchema.parse(
    await (
      await send(`/tasks/${taskId}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    ).json(),
  );
}
