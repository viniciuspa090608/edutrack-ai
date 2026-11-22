import { expect, it } from 'vitest';
import type { SubjectGoal } from '@study-platform/contracts';
import {
  calculateSubjectInsights,
  type SubjectEvidence,
} from './subject-insights.js';

const now = new Date('2026-11-22T12:00:00Z');
const goal: SubjectGoal = {
  indicator: 'tasks',
  target: 10,
  dueDate: '2026-11-28',
  timeZone: 'America/Sao_Paulo',
  startedAt: '2026-11-15T12:00:00Z',
};
const evidence: SubjectEvidence = {
  tasks: {
    total: 12,
    completed: 6,
    pending: 6,
    recent: 1,
    soon: 3,
    overdue: 1,
  },
  study: { hours: 1.25, recentHours: 0.5, intervals: 2 },
  reviews: {
    total: 5,
    good: 4,
    recentTotal: 5,
    recentGood: 4,
    previousTotal: 5,
    previousGood: 2,
  },
};
const calculate = (g: SubjectGoal | null = goal, e = evidence) =>
  calculateSubjectInsights(
    g,
    ['tasks', 'studyHours', 'reviewAccuracy'],
    e,
    now,
    'subject',
  );
it('computes 6/10, exact remaining and pace from real elapsed time, and independent due alerts', () => {
  const value = calculate();
  expect(value.progress).toMatchObject({
    current: 6,
    percent: 60,
    remaining: 4,
    daysLeft: 7,
    state: 'active',
    currentPerDay: 1 / 7,
  });
  expect(value.progress!.requiredPerDay).toBeCloseTo(4 / (6 + 15 / 24));
  expect(value.insights.find((i) => i.code === 'pace')!.information).toContain(
    'abaixo',
  );
  expect(
    value.insights.find((i) => i.code === 'due_soon')!.information,
  ).toContain('3');
  expect(
    value.insights.find((i) => i.code === 'execution')!.information,
  ).toContain('organização');
});
it('distinguishes missing goal, zero, absence, expired, achieved and disabled indicators', () => {
  expect(calculate(null).progress).toBeNull();
  expect(
    calculate(goal, {
      ...evidence,
      tasks: { ...evidence.tasks!, completed: 0 },
    }).progress!.state,
  ).toBe('no_progress');
  expect(
    calculate(goal, {
      ...evidence,
      tasks: { ...evidence.tasks!, total: 0, completed: 0 },
    }).progress!.state,
  ).toBe('no_data');
  expect(calculate({ ...goal, dueDate: '2026-11-21' }).progress!.state).toBe(
    'expired',
  );
  expect(calculate({ ...goal, target: 5 }).progress).toMatchObject({
    state: 'achieved',
    percent: 100,
    remaining: 0,
  });
  expect(
    calculateSubjectInsights(
      goal,
      [],
      { tasks: null, study: null, reviews: null },
      now,
      'subject',
    ).progress,
  ).toMatchObject({ state: 'unavailable', current: null });
});
it('keeps deadlines inclusive in the saved zone and handles daylight saving correctly', () => {
  const value = calculateSubjectInsights(
    { ...goal, dueDate: '2026-11-22' },
    ['tasks'],
    { ...evidence, study: null, reviews: null },
    new Date('2026-11-23T02:59:00Z'),
    's',
  );
  expect(value.progress!.state).toBe('active');
  expect(value.progress!.daysLeft).toBe(1);
  expect(
    calculateSubjectInsights(
      { ...goal, dueDate: '2026-11-22' },
      ['tasks'],
      { ...evidence, study: null, reviews: null },
      new Date('2026-11-23T03:00:00Z'),
      's',
    ).progress!.state,
  ).toBe('expired');
  const dst = calculateSubjectInsights(
    {
      ...goal,
      timeZone: 'America/New_York',
      dueDate: '2026-03-08',
      startedAt: '2026-03-01T05:00:00Z',
    },
    ['tasks'],
    { ...evidence, study: null, reviews: null },
    new Date('2026-03-08T05:00:00Z'),
    's',
  );
  expect(dst.progress!.requiredPerDay).toBeCloseTo(4 / (23 / 24));
});
it('requires samples for pace and two adequate review windows for a trend', () => {
  const small = calculate(
    { ...goal, startedAt: now.toISOString() },
    { ...evidence, reviews: { ...evidence.reviews!, previousTotal: 4 } },
  );
  expect(small.progress!.currentPerDay).toBeNull();
  expect(small.insights.map((i) => i.code)).toContain('insufficient_pace');
  expect(small.insights.map((i) => i.code)).toContain('insufficient_trend');
  expect(small.insights.map((i) => i.code)).not.toContain('review_trend');
  expect(
    calculate().insights.find((i) => i.code === 'review_trend')!.information,
  ).toContain('aumentou');
});
it('uses raw hours and recall ratios without projecting percentages linearly', () => {
  expect(
    calculate({ ...goal, indicator: 'studyHours', target: 2.5 }).progress,
  ).toMatchObject({ current: 1.25, percent: 50 });
  const r = calculate({ ...goal, indicator: 'reviewAccuracy', target: 80 });
  expect(r.progress).toMatchObject({
    current: 80,
    percent: 100,
    state: 'achieved',
    currentPerDay: null,
    requiredPerDay: null,
  });
  expect(
    calculate(
      { ...goal, indicator: 'reviewAccuracy' },
      { ...evidence, reviews: { ...evidence.reviews!, total: 0, good: 0 } },
    ).progress!.state,
  ).toBe('no_data');
});
