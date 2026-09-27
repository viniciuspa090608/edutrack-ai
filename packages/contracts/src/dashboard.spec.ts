import { expect, it } from 'vitest';
import {
  dashboardSchema,
  dashboardSectionSchema,
  dashboardTasksSchema,
} from './dashboard.js';
const error = { state: 'error', message: 'Indisponível' };
const data = {
  asOf: '2026-10-01T12:00:00.000Z',
  timeZone: 'UTC',
  preferences: { tasks: false, subjects: false, flashcards: false, ai: false },
  pomodoro: { state: 'empty', data: { session: null, completedSessions: 0 } },
  streak: error,
  week: error,
};
it('validates explicit empty/error sections and omits disabled modules instead of fabricating zeros', () => {
  expect(dashboardSchema.parse(data).tasks).toBeUndefined();
  expect(dashboardSchema.safeParse({ ...data, tasks: error }).success).toBe(
    false,
  );
  expect(
    dashboardSchema.safeParse({
      ...data,
      preferences: { ...data.preferences, tasks: true },
    }).success,
  ).toBe(false);
  expect(
    dashboardSchema.safeParse({ ...data, asOf: 'yesterday' }).success,
  ).toBe(false);
  expect(
    dashboardSchema.safeParse({ ...data, userId: 'foreign' }).success,
  ).toBe(false);
});
it('validates ready task summaries and rejects invalid states, counts and payloads', () => {
  const section = dashboardSectionSchema(dashboardTasksSchema);
  const ready = {
    state: 'ready',
    data: {
      counts: { PENDING: 2, IN_PROGRESS: 1, COMPLETED: 3 },
      upcoming: [],
      withoutDeadline: 3,
    },
  };
  expect(section.parse(ready)).toEqual(ready);
  expect(section.safeParse({ state: 'loading' }).success).toBe(false);
  expect(
    section.safeParse({ state: 'error', data: ready.data, message: 'erro' })
      .success,
  ).toBe(false);
  expect(
    section.safeParse({
      ...ready,
      data: { ...ready.data, withoutDeadline: -1 },
    }).success,
  ).toBe(false);
});
