import { expect, it } from 'vitest';
import { z } from 'zod';
import {
  assistantProviderActionSchema,
  assistantActionSchema,
} from './ai-assistant.js';
import {
  createSubjectSchema,
  newSubjectDefaults,
  subjectSchema,
  updateSubjectSchema,
  createPlanItemSchema,
  planOrderSchema,
  subjectPaginationSchema,
  subjectStudySummarySchema,
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

it('validates official summary values without extending subject write inputs', () => {
  for (const source of ['manual', 'roadmap'] as const) {
    expect(
      subjectStudySummarySchema.parse({
        source,
        total: 0,
        completed: 0,
        progressPercent: null,
      }).progressPercent,
    ).toBeNull();
    expect(
      subjectStudySummarySchema.parse({
        source,
        total: 4,
        completed: 1,
        progressPercent: 25,
      }).progressPercent,
    ).toBe(25);
  }
  expect(
    subjectStudySummarySchema.safeParse({
      source: 'manual',
      total: 1,
      completed: 0,
      progressPercent: -1,
    }).success,
  ).toBe(false);
  expect(
    createSubjectSchema.safeParse({
      ...input,
      studySummary: {
        source: 'manual',
        total: 0,
        completed: 0,
        progressPercent: null,
      },
    }).success,
  ).toBe(false);
});

it('normalizes minimal creation without adding defaults to patches or responses', () => {
  expect(
    createSubjectSchema.parse({
      name: ' Álgebra ',
      currentLevel: 'INTERMEDIATE',
      dueDate: '2027-05-20',
    }),
  ).toEqual({
    name: 'Álgebra',
    currentLevel: 'INTERMEDIATE',
    dueDate: '2027-05-20',
    objective: 'Estudar e me aprimorar em Álgebra',
    weeklyHours: 1,
    knownTopics: [],
  });
  expect(
    createSubjectSchema.parse({ ...input, objective: '  ' }).objective,
  ).toBe('Estudar e me aprimorar em Álgebra');
  expect(updateSubjectSchema.parse({ name: 'Novo' })).toEqual({ name: 'Novo' });
  expect(updateSubjectSchema.safeParse({ objective: '' }).success).toBe(false);
  expect(subjectSchema.safeParse({ name: 'Incompleto' }).success).toBe(false);
});
it('suggests six calendar months with end-of-month clamping', () => {
  expect(newSubjectDefaults('Teste', new Date(2026, 7, 31))).toMatchObject({
    dueDate: '2027-02-28',
    currentLevel: 'INTERMEDIATE',
  });
  expect(newSubjectDefaults('Teste', new Date(2023, 7, 31)).dueDate).toBe(
    '2024-02-29',
  );
  expect(newSubjectDefaults('Teste', new Date(2026, 10, 20)).dueDate).toBe(
    '2027-05-20',
  );
});

it('keeps upstream assistant JSON schema representable while normalizing subject previews', () => {
  expect(() => z.toJSONSchema(assistantProviderActionSchema)).not.toThrow();
  expect(
    assistantActionSchema.parse({
      kind: 'subject',
      subject: {
        name: 'Física',
        currentLevel: 'INTERMEDIATE',
        dueDate: '2027-05-20',
      },
    }),
  ).toMatchObject({
    subject: {
      objective: 'Estudar e me aprimorar em Física',
      weeklyHours: 1,
      knownTopics: [],
    },
  });
});
