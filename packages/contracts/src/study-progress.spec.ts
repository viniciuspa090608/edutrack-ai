import { expect, it } from 'vitest';
import {
  studyTimeZoneUpdateSchema,
  studyProgressSchema,
  studyAchievementCatalog,
} from './study-progress.js';
it('validates IANA zones and rejects foreign identifiers in account settings', () => {
  for (const timeZone of ['UTC', 'America/Sao_Paulo', 'America/New_York'])
    expect(studyTimeZoneUpdateSchema.safeParse({ timeZone }).success).toBe(
      true,
    );
  for (const timeZone of ['No/Zone', '+03:00', '', 'UTC; DROP TABLE users'])
    expect(studyTimeZoneUpdateSchema.safeParse({ timeZone }).success).toBe(
      false,
    );
  expect(
    studyTimeZoneUpdateSchema.safeParse({ timeZone: 'UTC', userId: 'someone' })
      .success,
  ).toBe(false);
});
it('shares all seven criteria with the web and API without persistence details', () => {
  const result = studyProgressSchema.parse({
    timeZone: 'UTC',
    trackingStartedAt: '2026-09-27T00:00:00.000Z',
    today: '2026-09-27',
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    achievements: studyAchievementCatalog.map((item) => ({
      ...item,
      progress: 0,
      earnedAt: null,
    })),
  });
  expect(result.achievements).toHaveLength(7);
  expect(
    studyProgressSchema.safeParse({ ...result, userId: 'internal' }).success,
  ).toBe(false);
});
