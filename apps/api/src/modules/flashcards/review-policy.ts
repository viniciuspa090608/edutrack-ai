import { reviewPolicyStateSchema } from '@study-platform/contracts';
import type {
  ReviewPolicyState,
  ReviewRating,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
export interface SchedulingPolicy {
  readonly id: string;
  readonly version: number;
  next(
    previousState: ReviewPolicyState,
    rating: ReviewRating,
    reviewedAt: Date,
  ): { state: ReviewPolicyState; dueAt: Date; intervalSeconds: number };
}
export const initialPolicyState = (): ReviewPolicyState => ({
  intervalSeconds: 0,
  ease: 2.5,
  successStreak: 0,
  consolidated: false,
});
export const sm2InspiredV1: SchedulingPolicy = {
  id: 'sm2-inspired',
  version: 1,
  next(previous, rating, reviewedAt) {
    const old = reviewPolicyStateSchema.parse(previous);
    const days = old.intervalSeconds / 86400;
    const hard = Math.max(1, Math.ceil(days * 1.2));
    const good = Math.max(3, Math.ceil(days * old.ease), hard + 1);
    const easy = Math.max(5, Math.ceil(days * old.ease * 1.3), good + 1);
    const intervalSeconds =
      rating === 'AGAIN'
        ? 600
        : 86400 *
          Math.min(
            365,
            old.consolidated
              ? { HARD: hard, GOOD: good, EASY: easy }[rating]
              : { HARD: 1, GOOD: 3, EASY: 5 }[rating],
          );
    const ease = Math.max(
      1.3,
      Math.min(
        3,
        Math.round(
          (old.ease +
            { AGAIN: -0.2, HARD: -0.15, GOOD: 0, EASY: 0.15 }[rating]) *
            100,
        ) / 100,
      ),
    );
    const state = reviewPolicyStateSchema.parse({
      intervalSeconds,
      ease,
      successStreak: rating === 'AGAIN' ? 0 : old.successStreak + 1,
      consolidated: rating !== 'AGAIN',
    });
    return {
      state,
      intervalSeconds,
      dueAt: new Date(reviewedAt.getTime() + intervalSeconds * 1000),
    };
  },
};
export class PolicyRegistry {
  constructor(
    private readonly policies: readonly SchedulingPolicy[] = [sm2InspiredV1],
  ) {}
  resolve(id: string, version: number) {
    const policy = this.policies.find(
      (policy) => policy.id === id && policy.version === version,
    );
    if (!policy)
      throw new HttpError(
        409,
        'REVIEW_POLICY_INCOMPATIBLE',
        'O estado exige migração explícita da política de revisão.',
      );
    return policy;
  }
}
