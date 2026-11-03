import { expect, it, vi } from 'vitest';
import { ClassroomTokenCrypto } from '../src/modules/classroom/token-crypto.js';
import { ClassroomGoogleClient } from '../src/modules/classroom/google-client.js';
import { loadEnv, parseEnv } from '../src/config/env.js';

it('authenticates token encryption to the user and rejects tampering', () => {
  const crypto = new ClassroomTokenCrypto('d'.repeat(64));
  const encrypted = crypto.encrypt('user-a', {
    accessToken: 'synthetic-private-token',
  });
  expect(encrypted).not.toContain('synthetic-private-token');
  expect(crypto.decrypt('user-a', encrypted)).toEqual({
    accessToken: 'synthetic-private-token',
  });
  expect(() => crypto.decrypt('user-b', encrypted)).toThrow();
  const parts = encrypted.split('.');
  parts[2] = Buffer.from('tampered').toString('base64url');
  expect(() => crypto.decrypt('user-a', parts.join('.'))).toThrow();
});
it('validates independent Classroom keys without leaking key values', () => {
  const env = loadEnv();
  const base = {
    ...process.env,
    GOOGLE_CLIENT_ID: 'synthetic-client',
    GOOGLE_CLIENT_SECRET: 'synthetic-secret',
    CLASSROOM_ENCRYPTION_KEY: 'd'.repeat(64),
  };
  expect(() =>
    parseEnv({
      ...base,
      CLASSROOM_ENCRYPTION_KEY: env.AI_CREDENTIAL_ENCRYPTION_KEY,
    }),
  ).toThrow('CLASSROOM_ENCRYPTION_KEY');
  expect(() =>
    parseEnv({ ...base, CLASSROOM_ENCRYPTION_KEY: 'not-a-real-secret' }),
  ).not.toThrow('not-a-real-secret');
});
it('retries Google throttling finitely and verifies authorization before every attempt', async () => {
  const access = vi.fn(async () => 'synthetic-token');
  let count = 0;
  const transport = vi.fn<typeof fetch>(async () => {
    count++;
    return count < 3
      ? new Response(null, { status: 429 })
      : Response.json({ courses: [] });
  });
  const client = new ClassroomGoogleClient(
    {
      access,
    } as unknown as import('../src/modules/classroom/classroom-oauth.service.js').ClassroomOAuthService,
    transport,
  );
  expect((await client.courses('user', 1)).items).toEqual([]);
  expect(transport).toHaveBeenCalledTimes(3);
  expect(access).toHaveBeenCalledTimes(3);
});

it('recognizes only the canonical read-only Classroom grant aliases', async () => {
  const { hasClassroomScope, classroomScopes, permissions } =
    await import('../src/modules/classroom/scopes.js');
  const canonical =
    'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly';
  expect(hasClassroomScope([canonical], classroomScopes.coursework)).toBe(true);
  expect(permissions([canonical]).coursework).toBe(true);
  expect(
    hasClassroomScope(
      ['https://www.googleapis.com/auth/classroom.student-submissions.me'],
      classroomScopes.coursework,
    ),
  ).toBe(false);
  expect(
    hasClassroomScope([canonical], classroomScopes.teacherCoursework),
  ).toBe(false);
});
