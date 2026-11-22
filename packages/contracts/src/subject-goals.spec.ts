import { expect, it } from 'vitest';
import { subjectGoalInputSchema } from './subject-goals.js';

const input = {
  indicator: 'tasks',
  target: 10,
  dueDate: '2026-12-01',
  timeZone: 'America/Sao_Paulo',
};
it('accepts measurable goals and rejects invalid dates, precision, forged ownership and unsupported indicators', () => {
  expect(subjectGoalInputSchema.parse(input).target).toBe(10);
  for (const patch of [
    { indicator: 'grades' },
    { target: 1.5 },
    { target: 0 },
    { target: 1.00001 },
    { dueDate: '2026-02-30' },
    { timeZone: 'Moon/Sea' },
    { userId: 'forged' },
    { indicator: 'reviewAccuracy', target: 101 },
  ]) {
    expect(
      subjectGoalInputSchema.safeParse({ ...input, ...patch }).success,
    ).toBe(false);
  }
  expect(
    subjectGoalInputSchema.safeParse({
      ...input,
      indicator: 'studyHours',
      target: 1.25,
    }).success,
  ).toBe(true);
});
