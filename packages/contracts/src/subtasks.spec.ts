import { randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import {
  createSubtaskSchema,
  updateSubtaskSchema,
  subtaskOrderSchema,
  completeSubtasksSchema,
  taskSchema,
} from './tasks.js';
it('validates subtask titles, partial updates, ordering and explicit confirmation', () => {
  expect(createSubtaskSchema.parse({ title: '  Revisar  ' })).toEqual({
    title: 'Revisar',
  });
  expect(updateSubtaskSchema.parse({ isCompleted: false })).toEqual({
    isCompleted: false,
  });
  for (const input of [
    { title: ' ' },
    { title: 'a'.repeat(161) },
    { title: 'a', taskId: randomUUID() },
    { title: 'a', isCompleted: true },
  ])
    expect(createSubtaskSchema.safeParse(input).success).toBe(false);
  for (const input of [
    {},
    { title: undefined },
    { title: null },
    { isCompleted: 1 },
    { position: 0 },
  ])
    expect(updateSubtaskSchema.safeParse(input).success).toBe(false);
  const id = randomUUID();
  expect(subtaskOrderSchema.parse({ ids: [id] }).ids).toEqual([id]);
  for (const input of [
    { ids: [id, id] },
    { ids: ['bad'] },
    { ids: [id], taskId: id },
  ])
    expect(subtaskOrderSchema.safeParse(input).success).toBe(false);
  for (const input of [
    {},
    { confirm: false },
    { confirm: 'true' },
    { confirm: true, status: 'COMPLETED' },
  ])
    expect(completeSubtasksSchema.safeParse(input).success).toBe(false);
  expect(completeSubtasksSchema.parse({ confirm: true })).toEqual({
    confirm: true,
  });
});
it('requires calculated counters and progress in the public task response', () => {
  const task = {
    subjectId: null,
    id: randomUUID(),
    title: 'a',
    description: null,
    dueDate: null,
    priority: 'MEDIUM',
    status: 'PENDING',
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-09-26T12:00:00Z',
    subtaskTotal: 0,
    subtaskCompleted: 0,
    progressPercent: null,
  };
  expect(taskSchema.parse(task).progressPercent).toBeNull();
  expect(
    taskSchema.parse({
      ...task,
      subtaskTotal: 4,
      subtaskCompleted: 1,
      progressPercent: 25,
    }).progressPercent,
  ).toBe(25);
  for (const progressPercent of [-1, 101])
    expect(taskSchema.safeParse({ ...task, progressPercent }).success).toBe(
      false,
    );
});
