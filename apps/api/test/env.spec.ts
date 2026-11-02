import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseEnv } from '../src/config/env.js';

const validEnv = {
  NODE_ENV: 'test',
  API_PORT: '3001',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3307',
  DB_USER: 'root',
  DB_PASSWORD: 'secret-value',
  DB_NAME: 'study_platform_dev',
  TEST_DB_NAME: 'study_platform_test',
  WEB_ORIGIN: 'http://localhost:5173',
  API_PUBLIC_ORIGIN: 'http://localhost:3001',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  SMTP_FROM: 'no-reply@example.test',
  EMAIL_HMAC_KEY: 'a'.repeat(64),
  EMAIL_ENCRYPTION_KEY: 'b'.repeat(64),
  AI_CREDENTIAL_ENCRYPTION_KEY: 'e'.repeat(64),
  AI_CREDENTIAL_KEY_VERSION: 'v1',
};

describe('API environment', () => {
  it('requires explicit Gemini pairs, independent credential encryption and positive limits without leaking secrets', () => {
    expect(parseEnv(validEnv).GEMINI_API_KEY).toBeUndefined();
    expect(
      parseEnv({ ...validEnv, AI_RECEIPT_KEY: 'c'.repeat(64) }).AI_RECEIPT_KEY,
    ).toBeDefined();
    const ai = {
      ...validEnv,
      GEMINI_API_KEY: 'synthetic-canary',
      GEMINI_MODEL: 'gemini-3.8-flash',
      AI_RECEIPT_KEY: 'c'.repeat(64),
    };
    expect(parseEnv(ai).AI_TIMEOUT_MS).toBe(30000);
    for (const patch of [
      { GEMINI_API_KEY: undefined },
      { GEMINI_MODEL: undefined },
      { GEMINI_MODEL: 'gpt-4.1' },
      { AI_API_KEY: 'legacy-canary' },
      { AI_MODEL: 'legacy-model' },
      { AI_CREDENTIAL_ENCRYPTION_KEY: undefined },
      { AI_CREDENTIAL_KEY_VERSION: '' },
      { AI_CREDENTIAL_ENCRYPTION_KEY: 'a'.repeat(64) },
      { AI_CREDENTIAL_ENCRYPTION_KEY: 'b'.repeat(64) },
      { AI_CREDENTIAL_ENCRYPTION_KEY: 'c'.repeat(64) },
      { AI_USER_REQUESTS_PER_MINUTE: '0' },
      { AI_USER_MAX_CONCURRENCY: '-1' },
      { AI_DEFAULT_USER_DAILY_LIMIT: '1.5' },
      { AI_DEFAULT_GLOBAL_DAILY_LIMIT: '0' },
      { AI_DEFAULT_GLOBAL_MAX_CONCURRENCY: '0' },
      { AI_RECEIPT_KEY: 'invalid-canary' },
      { AI_TIMEOUT_MS: '0' },
      { AI_TIMEOUT_MS: '120001' },
      { AI_MAX_RESPONSE_BYTES: '1023' },
      { AI_MAX_RESPONSE_BYTES: '1048577' },
    ]) {
      expect(() => parseEnv({ ...ai, ...patch })).toThrow(EnvValidationError);
      try {
        parseEnv({ ...ai, ...patch });
      } catch (error) {
        expect((error as Error).message).not.toMatch(
          /synthetic-canary|legacy-canary|invalid-canary/,
        );
      }
    }
  });
  it('parses typed values', () => {
    const parsed = parseEnv(validEnv);
    expect(parsed.API_PORT).toBe(3001);
    expect(parsed.DB_PORT).toBe(3307);
  });

  it('names missing and invalid keys without exposing secrets', () => {
    const input = {
      ...validEnv,
      DB_PASSWORD: undefined,
      API_PORT: 'not-a-port',
    };
    expect(() => parseEnv(input)).toThrow(EnvValidationError);
    try {
      parseEnv(input);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('DB_PASSWORD');
      expect(message).toContain('API_PORT');
      expect(message).not.toContain('secret-value');
    }
  });

  it('rejects using the development database for integration tests', () => {
    expect(() =>
      parseEnv({ ...validEnv, TEST_DB_NAME: validEnv.DB_NAME }),
    ).toThrow('TEST_DB_NAME');
  });

  it('requires an HTTP(S) web origin', () => {
    expect(() =>
      parseEnv({ ...validEnv, WEB_ORIGIN: 'ftp://localhost:5173' }),
    ).toThrow('WEB_ORIGIN');
  });

  it('rejects split Google credentials without exposing values', () => {
    expect(() =>
      parseEnv({ ...validEnv, GOOGLE_CLIENT_ID: 'private-client-id' }),
    ).toThrow('GOOGLE_CLIENT_SECRET');
    try {
      parseEnv({ ...validEnv, GOOGLE_CLIENT_ID: 'private-client-id' });
    } catch (error) {
      expect((error as Error).message).not.toContain('private-client-id');
    }
  });

  it('requires HTTPS and same-site origins in production', () => {
    const production = {
      ...validEnv,
      NODE_ENV: 'production',
      GOOGLE_CLIENT_ID: 'client',
      GOOGLE_CLIENT_SECRET: 'secret',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_FROM: 'mail@example.com',
      EMAIL_HMAC_KEY: 'a'.repeat(64),
      EMAIL_ENCRYPTION_KEY: 'b'.repeat(64),
    };
    expect(() => parseEnv(production)).toThrow('API_PUBLIC_ORIGIN');
    expect(() =>
      parseEnv({
        ...production,
        WEB_ORIGIN: 'https://web.example.com',
        API_PUBLIC_ORIGIN: 'https://api.other.com',
      }),
    ).toThrow('API_PUBLIC_ORIGIN');
    expect(
      parseEnv({
        ...production,
        WEB_ORIGIN: 'https://web.example.com',
        API_PUBLIC_ORIGIN: 'https://api.example.com',
      }).API_PUBLIC_ORIGIN,
    ).toBe('https://api.example.com');
  });

  it('validates mail settings and distinct keys without printing secrets', () => {
    expect(() => parseEnv({ ...validEnv, SMTP_PORT: undefined })).toThrow(
      'SMTP_PORT',
    );
    expect(() =>
      parseEnv({ ...validEnv, EMAIL_HMAC_KEY: 'private-key' }),
    ).toThrow('EMAIL_HMAC_KEY');
    expect(() => parseEnv({ ...validEnv, SMTP_USER: 'private-user' })).toThrow(
      'SMTP_PASSWORD',
    );
    try {
      parseEnv({ ...validEnv, EMAIL_HMAC_KEY: 'private-key' });
    } catch (error) {
      expect((error as Error).message).not.toContain('private-key');
    }
  });
});
