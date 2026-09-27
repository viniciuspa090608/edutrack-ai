import { expect, it } from 'vitest';
import { projectProgress } from './progress-projection.js';
const event = (
  day: string,
  kind = 'TASK_COMPLETED',
  time = `${day}T12:00:00Z`,
  id = time,
) => ({ id, kind, local_date: day, occurred_at: new Date(time) });
it('uses distinct calendar dates, today/yesterday grace and gaps rather than elapsed hours', () => {
  expect(projectProgress([], '2026-03-09')).toMatchObject({
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
  });
  const events = [
    event('2026-03-07', undefined, '2026-03-08T04:59:00Z'),
    event('2026-03-08', undefined, '2026-03-08T07:01:00Z'),
    event('2026-03-08'),
    event('2026-03-06'),
  ];
  expect(projectProgress(events, '2026-03-09')).toMatchObject({
    activeDays: 3,
    currentStreak: 3,
    longestStreak: 3,
  });
  expect(projectProgress(events, '2026-03-10')).toMatchObject({
    currentStreak: 0,
    longestStreak: 3,
  });
  expect(
    projectProgress([...events, event('2026-03-10')], '2026-03-10'),
  ).toMatchObject({ currentStreak: 1, longestStreak: 3 });
});
it('awards all seven criteria at their first chronological threshold even with shuffled delivery', () => {
  const events = Array.from({ length: 10 }, (_, i) =>
    event(`2026-10-${String(i + 1).padStart(2, '0')}`),
  );
  for (const [kind, count] of [
    ['POMODORO_BLOCK_COMPLETED', 5],
    ['FLASHCARD_REVIEWED', 20],
    ['SUBJECT_PLAN_ITEM_COMPLETED', 2],
    ['ROADMAP_BLOCK_COMPLETED', 3],
  ] as const)
    for (let i = 0; i < count; i++)
      events.push(
        event('2026-10-10', kind, '2026-10-10T15:00:00Z', `${kind}-${i}`),
      );
  const result = projectProgress(events.reverse(), '2026-10-11');
  expect(result.earned.size).toBe(7);
  expect(result.earned.get('FIRST_DAY')?.local_date).toBe('2026-10-01');
  expect(result.earned.get('THREE_DAY_STREAK')?.local_date).toBe('2026-10-03');
  expect(result.earned.get('SEVEN_DAY_STREAK')?.local_date).toBe('2026-10-07');
  expect(result.progress).toMatchObject({
    TEN_TASKS: 10,
    FIVE_POMODORO_BLOCKS: 5,
    TWENTY_REVIEWS: 20,
    FIVE_SUBJECT_MILESTONES: 5,
  });
});
