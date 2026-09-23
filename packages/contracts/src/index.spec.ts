import { describe, expect, it } from 'vitest';
import { errorResponseSchema, healthResponseSchema } from './index.js';

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
