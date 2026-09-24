import { describe, expect, it } from 'vitest';
import {
  authErrorCodeSchema,
  errorResponseSchema,
  healthResponseSchema,
  loginRequestSchema,
  meResponseSchema,
  registerRequestSchema,
} from './index.js';

describe('shared HTTP contracts', () => {
  it('accepts expected payloads', () => {
    expect(healthResponseSchema.parse({ status: 'ok' })).toEqual({
      status: 'ok',
    });
    expect(
      errorResponseSchema.parse({
        error: { code: 'NOT_FOUND', message: 'Missing' },
      }),
    ).toEqual({
      error: { code: 'NOT_FOUND', message: 'Missing' },
    });
  });

  it('rejects incompatible external data', () => {
    expect(healthResponseSchema.safeParse({ status: 'failed' }).success).toBe(
      false,
    );
    expect(
      errorResponseSchema.safeParse({ error: { code: '', message: '' } })
        .success,
    ).toBe(false);
  });
});

describe('authentication contracts', () => {
  it('normalizes email and preserves password bytes', () => {
    expect(
      registerRequestSchema.parse({
        email: '  Example@Example.COM ',
        password: '  abcdefghij  ',
      }),
    ).toEqual({ email: 'example@example.com', password: '  abcdefghij  ' });
  });

  it('rejects invalid input and accepts a public account response', () => {
    expect(
      registerRequestSchema.safeParse({ email: 'invalid', password: 'short' })
        .success,
    ).toBe(false);
    expect(
      loginRequestSchema.safeParse({ email: 'a@example.com', password: '' })
        .success,
    ).toBe(false);
    expect(
      meResponseSchema.parse({
        user: {
          id: '00000000-0000-4000-8000-000000000000',
          email: 'a@example.com',
          googleLinked: false,
        },
      }).user.email,
    ).toBe('a@example.com');
    expect(authErrorCodeSchema.safeParse('INTERNAL_SECRET').success).toBe(
      false,
    );
  });
});
