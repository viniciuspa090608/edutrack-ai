import { expect, it } from 'vitest';
import {
  createSubjectSchema,
  updateSubjectSchema,
  createPlanItemSchema,
  planOrderSchema,
  subjectPaginationSchema,
} from './subjects.js';
import { createTaskSchema, updateTaskSchema } from './tasks.js';
import { startPomodoroSchema } from './pomodoro.js';
const input = {
  name: ' Álgebra ',
  currentLevel: 'BEGINNER',
  objective: ' Aprender ',
  dueDate: '2024-02-29',
  weeklyHours: 0.5,
  knownTopics: [],
};
it('validates levels, calendar dates, limits, half hours and ordered known topics', () => {
  expect(createSubjectSchema.parse(input)).toMatchObject({
    name: 'Álgebra',
    objective: 'Aprender',
    knownTopics: [],
  });
  for (const fields of [
    { name: '' },
    { name: 'a'.repeat(121) },
    { objective: '' },
    { objective: 'a'.repeat(1001) },
    { currentLevel: 'EXPERT' },
    { dueDate: '2025-02-29' },
    { weeklyHours: 0 },
    { weeklyHours: 168.5 },
    { weeklyHours: 1.25 },
    { knownTopics: [''] },
    { knownTopics: [' Tema ', 'tema'] },
    { knownTopics: ['a'.repeat(161)] },
    { userId: 'bad' },
  ])
    expect(createSubjectSchema.safeParse({ ...input, ...fields }).success).toBe(
      false,
    );
  expect(
    createSubjectSchema.parse({
      ...input,
      weeklyHours: 168,
      knownTopics: [' b ', 'a'],
    }),
  ).toMatchObject({ knownTopics: ['b', 'a'] });
  for (const patch of [{}, { name: undefined }, { id: 'bad' }])
    expect(updateSubjectSchema.safeParse(patch).success).toBe(false);
  expect(updateSubjectSchema.parse({ knownTopics: [] })).toEqual({
    knownTopics: [],
  });
});
it('validates plans, pagination and explicit absence of optional associations', () => {
  expect(createPlanItemSchema.parse({ title: ' Tema ' })).toEqual({
    title: 'Tema',
    status: 'PENDING',
  });
  for (const item of [
    { title: '' },
    { title: 'a'.repeat(161) },
    { title: 'a', status: 'DONE' },
  ])
    expect(createPlanItemSchema.safeParse(item).success).toBe(false);
  expect(planOrderSchema.safeParse({ ids: ['bad'] }).success).toBe(false);
  expect(subjectPaginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  expect(subjectPaginationSchema.safeParse({ pageSize: 101 }).success).toBe(
    false,
  );
  expect(createTaskSchema.parse({ title: 'a' }).subjectId).toBe(null);
  expect(updateTaskSchema.parse({ subjectId: null })).toEqual({
    subjectId: null,
  });
  expect(startPomodoroSchema.parse({})).toEqual({});
  for (const subjectId of ['bad', 2]) {
    expect(createTaskSchema.safeParse({ title: 'a', subjectId }).success).toBe(
      false,
    );
    expect(startPomodoroSchema.safeParse({ subjectId }).success).toBe(false);
  }
});
