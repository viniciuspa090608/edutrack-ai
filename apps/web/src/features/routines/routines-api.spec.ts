import { afterEach, expect, it, vi } from 'vitest';
import {
  deleteRoutine,
  listRoutines,
  routineSchedule,
} from './routines-api.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each([
  ['list', () => listRoutines()],
  ['schedule', () => routineSchedule()],
  ['delete', () => deleteRoutine('00000000-0000-4000-8000-000000000001')],
] as const)(
  'refreshes preferences when another session disables routines (%s)',
  async (_label, action) => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: { code: 'MODULE_DISABLED' } }, { status: 403 }),
      ),
    );
    const changed = vi.fn();
    window.addEventListener('edutrack:preferences', changed);
    try {
      await expect(action()).rejects.toMatchObject({
        status: 403,
        code: 'MODULE_DISABLED',
      });
      expect(changed).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('edutrack:preferences', changed);
    }
  },
);
