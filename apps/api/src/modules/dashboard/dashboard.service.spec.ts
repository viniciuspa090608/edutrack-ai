import { expect, it, vi } from 'vitest';
import { DashboardService } from './dashboard.service.js';
import type { DashboardSources } from './dashboard.service.js';
it('bounds a slow producer and keeps independent sections without consulting disabled producers', async () => {
  const unavailable = async () => {
    throw new Error('offline');
  };
  const sources: DashboardSources = {
    preferences: {
      read: async () => ({
        tasks: true,
        subjects: false,
        flashcards: false,
        ai: false,
      }),
    },
    tasks: { dashboardSummary: () => new Promise(() => {}) },
    subjects: { dashboardSummary: vi.fn(unavailable) },
    reviews: { pending: vi.fn(unavailable) },
    pomodoro: {
      dashboardSummary: async () => ({ session: null, completedSessions: 0 }),
    },
    progress: {
      settings: async () => ({
        timeZone: 'UTC',
        trackingStartedAt: '2026-10-01T00:00:00.000Z',
      }),
      read: unavailable,
    },
    analytics: { read: unavailable },
  };
  const result = await new DashboardService(
    sources,
    () => new Date('2026-10-05T12:00:00Z'),
    25,
  ).read('account');
  expect(result.tasks?.state).toBe('error');
  expect(result.pomodoro.state).toBe('empty');
  expect(sources.subjects.dashboardSummary).not.toHaveBeenCalled();
  expect(sources.reviews.pending).not.toHaveBeenCalled();
});
