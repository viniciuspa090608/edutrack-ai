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
};

describe('API environment', () => {
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
});
