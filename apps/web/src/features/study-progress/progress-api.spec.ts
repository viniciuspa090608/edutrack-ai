import { afterEach, expect, it, vi } from 'vitest';
import { saveStudyTimeZone } from './progress-api.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('sends timezone JSON with its media type and authenticated credentials', async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001');
  const settings = {
    timeZone: 'America/Sao_Paulo',
    trackingStartedAt: '2026-09-27T12:00:00.000Z',
  };
  const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => {
    expect(new Headers(options?.headers).get('Content-Type')).toBe(
      'application/json',
    );
    expect(JSON.parse(options?.body as string)).toEqual({
      timeZone: settings.timeZone,
    });
    return Response.json(settings);
  });
  vi.stubGlobal('fetch', fetchMock);
  expect(await saveStudyTimeZone(settings.timeZone)).toEqual(settings);
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3001/account/study-timezone',
    expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
  );
});
