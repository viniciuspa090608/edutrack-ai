/** Keep real MySQL settings, but never use personal external-service credentials. */
export function isolatedTestEnv(input: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...input,
    NODE_ENV: 'test',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    CLASSROOM_ENCRYPTION_KEY: '',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    SMTP_FROM: 'no-reply@example.test',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    EMAIL_HMAC_KEY: 'a'.repeat(64),
    EMAIL_ENCRYPTION_KEY: 'b'.repeat(64),
    AI_API_KEY: '',
    AI_MODEL: '',
    AI_RECEIPT_KEY: '',
    GEMINI_API_KEY: '',
    GEMINI_MODEL: '',
    AI_CREDENTIAL_ENCRYPTION_KEY: 'e'.repeat(64),
    AI_CREDENTIAL_KEY_VERSION: 'test-v1',
    AI_TIMEOUT_MS: '30000',
    AI_MAX_RESPONSE_BYTES: '524288',
    DEV_WEB_ORIGINS: '',
  };
}
