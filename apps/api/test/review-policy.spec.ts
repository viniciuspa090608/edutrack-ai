import { expect, it } from 'vitest';
import {
  initialPolicyState,
  sm2InspiredV1,
  PolicyRegistry,
} from '../src/modules/flashcards/review-policy.js';
import type { SchedulingPolicy } from '../src/modules/flashcards/review-policy.js';
const at = new Date('2026-10-01T12:00:00Z');
it.each([
  ['AGAIN', 600],
  ['HARD', 86400],
  ['GOOD', 259200],
  ['EASY', 432000],
] as const)(
  'schedules first %s at the exact UTC duration',
  (rating, seconds) => {
    const previous = initialPolicyState(),
      snapshot = { ...previous };
    const result = sm2InspiredV1.next(previous, rating, at);
    expect(result.intervalSeconds).toBe(seconds);
    expect(result.dueAt.getTime()).toBe(at.getTime() + seconds * 1000);
    expect(previous).toEqual(snapshot);
  },
);
it('uses prior ease, enforces ordered intervals, caps 365 days and restarts after forgetting', () => {
  const first = sm2InspiredV1.next(initialPolicyState(), 'GOOD', at);
  expect(sm2InspiredV1.next(first.state, 'GOOD', at).intervalSeconds).toBe(
    8 * 86400,
  );
  const hard = sm2InspiredV1.next(first.state, 'HARD', at),
    good = sm2InspiredV1.next(first.state, 'GOOD', at),
    easy = sm2InspiredV1.next(first.state, 'EASY', at);
  expect(hard.intervalSeconds).toBeLessThan(good.intervalSeconds);
  expect(good.intervalSeconds).toBeLessThan(easy.intervalSeconds);
  let state = first.state;
  for (let index = 0; index < 50; index++)
    state = sm2InspiredV1.next(state, 'EASY', at).state;
  expect(state.ease).toBe(3);
  expect(state.intervalSeconds).toBe(365 * 86400);
  for (let index = 0; index < 50; index++)
    state = sm2InspiredV1.next(state, 'HARD', at).state;
  expect(state.ease).toBe(1.3);
  const forgotten = sm2InspiredV1.next(state, 'AGAIN', at);
  expect(forgotten.state).toMatchObject({
    successStreak: 0,
    consolidated: false,
    intervalSeconds: 600,
    ease: 1.3,
  });
  expect(sm2InspiredV1.next(forgotten.state, 'GOOD', at).intervalSeconds).toBe(
    259200,
  );
  expect(sm2InspiredV1.next(forgotten.state, 'GOOD', at)).toEqual(
    sm2InspiredV1.next(forgotten.state, 'GOOD', at),
  );
});
it('allows a substitute interface while refusing to reinterpret an unregistered version', () => {
  const replacement: SchedulingPolicy = {
    id: 'future',
    version: 2,
    next(previous, _rating, reviewedAt) {
      return {
        state: { ...previous, intervalSeconds: 60 },
        intervalSeconds: 60,
        dueAt: new Date(reviewedAt.getTime() + 60000),
      };
    },
  };
  const registry = new PolicyRegistry([replacement]);
  expect(
    registry.resolve('future', 2).next(initialPolicyState(), 'GOOD', at)
      .intervalSeconds,
  ).toBe(60);
  expect(() => registry.resolve('sm2-inspired', 1)).toThrow(
    /migração explícita/,
  );
  expect(() => new PolicyRegistry().resolve('sm2-inspired', 2)).toThrow(
    /migração explícita/,
  );
});
