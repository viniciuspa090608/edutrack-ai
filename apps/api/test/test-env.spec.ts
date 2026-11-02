import { expect, it } from 'vitest';
import { isolatedTestEnv } from './test-env.js';
import { loadEnv } from '../src/config/env.js';

it('preserves real database configuration while isolating personal service secrets', () => {
  const input = {
    DB_HOST: '127.0.0.1',
    DB_PORT: '3306',
    DB_USER: 'integration',
    DB_PASSWORD: 'database-canary',
    DB_NAME: 'development',
    TEST_DB_NAME: 'isolated_test',
    NODE_ENV: 'production',
    AI_RECEIPT_KEY: 'receipt-canary',
    GOOGLE_CLIENT_SECRET: 'google-canary',
    SMTP_PASSWORD: 'smtp-canary',
    EMAIL_ENCRYPTION_KEY: 'email-canary',
  };
  const isolated = isolatedTestEnv(input);
  for (const key of [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'TEST_DB_NAME',
  ])
    expect(isolated[key]).toBe(input[key as keyof typeof input]);
  expect(isolated.NODE_ENV).toBe('test');
  expect(JSON.stringify(isolated)).not.toMatch(
    /receipt-canary|google-canary|smtp-canary|email-canary/,
  );
  expect(input.AI_RECEIPT_KEY).toBe('receipt-canary');
  const env = loadEnv();
  expect(env.AI_API_KEY).toBeUndefined();
  expect(env.AI_RECEIPT_KEY).toBeUndefined();
  expect(env.GOOGLE_CLIENT_SECRET).toBeUndefined();
  expect(env.SMTP_PASSWORD).toBeUndefined();
});
