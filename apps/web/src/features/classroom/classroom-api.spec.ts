import { afterEach, expect, it, vi } from 'vitest';
import { classroomRequest } from './classroom-api.js';

afterEach(() => vi.unstubAllGlobals());

it.each(['DELETE', 'POST'])(
  'sends authenticated JSON for bodyless %s actions required by the API write guard',
  async (method) => {
    const boundary = vi.fn<typeof fetch>(async () =>
      Response.json({ revocationConfirmed: true }),
    );
    vi.stubGlobal('fetch', boundary);
    await classroomRequest('/integrations/google-classroom/connection', method);
    const options = boundary.mock.calls[0]![1]!;
    expect(options.credentials).toBe('include');
    expect(new Headers(options.headers).get('Content-Type')).toBe(
      'application/json',
    );
    expect(options.body).toBe('{}');
  },
);

it('keeps reads without a body and preserves explicit write payloads', async () => {
  const boundary = vi.fn<typeof fetch>(async () => Response.json({}));
  vi.stubGlobal('fetch', boundary);
  await classroomRequest('/integrations/google-classroom/connection');
  expect(boundary.mock.calls[0]![1]).not.toHaveProperty('body');
  await classroomRequest('/integrations/google-classroom/selection', 'PUT', {
    courses: [],
  });
  expect(boundary.mock.calls[1]![1]!.body).toBe('{"courses":[]}');
});
