import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getDomain } from 'tldts';

const rootEnvPath = fileURLToPath(new URL('../../../../.env', import.meta.url));

const port = z.coerce.number().int().min(1).max(65535);
const origin = z.url().refine(
  (value) => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  },
  { message: 'must be an HTTP(S) origin without a path' },
);
const optionalCredential = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const optionalKey = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/)
    .optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    API_PORT: port,
    DB_HOST: z.string().min(1),
    DB_PORT: port,
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
    TEST_DB_NAME: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
    WEB_ORIGIN: origin,
    API_PUBLIC_ORIGIN: origin,
    GOOGLE_CLIENT_ID: optionalCredential,
    GOOGLE_CLIENT_SECRET: optionalCredential,
    SMTP_HOST: optionalCredential,
    SMTP_PORT: z.preprocess(
      (value) => (value === '' ? undefined : value),
      port.optional(),
    ),
    SMTP_USER: optionalCredential,
    SMTP_PASSWORD: optionalCredential,
    SMTP_FROM: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.email().optional(),
    ),
    EMAIL_HMAC_KEY: optionalKey,
    EMAIL_ENCRYPTION_KEY: optionalKey,
  })
  .refine((value) => value.DB_NAME !== value.TEST_DB_NAME, {
    path: ['TEST_DB_NAME'],
    message: 'must differ from DB_NAME',
  })
  .superRefine((value, context) => {
    const emailKeys = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_FROM',
      'EMAIL_HMAC_KEY',
      'EMAIL_ENCRYPTION_KEY',
    ] as const;
    for (const key of emailKeys) {
      if (value[key] === undefined)
        context.addIssue({
          code: 'custom',
          path: [key],
          message: 'required for email delivery',
        });
    }
    if (Boolean(value.SMTP_USER) !== Boolean(value.SMTP_PASSWORD)) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_USER'],
        message: 'SMTP credentials must be configured together',
      });
      context.addIssue({
        code: 'custom',
        path: ['SMTP_PASSWORD'],
        message: 'SMTP credentials must be configured together',
      });
    }
    if (
      value.EMAIL_HMAC_KEY &&
      value.EMAIL_ENCRYPTION_KEY &&
      value.EMAIL_HMAC_KEY.toLowerCase() ===
        value.EMAIL_ENCRYPTION_KEY.toLowerCase()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['EMAIL_ENCRYPTION_KEY'],
        message: 'email keys must differ',
      });
    }
    if (
      Boolean(value.GOOGLE_CLIENT_ID) !== Boolean(value.GOOGLE_CLIENT_SECRET)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_ID'],
        message: 'Google credentials must be configured together',
      });
      context.addIssue({
        code: 'custom',
        path: ['GOOGLE_CLIENT_SECRET'],
        message: 'Google credentials must be configured together',
      });
    }
    if (value.NODE_ENV === 'production') {
      if (!value.GOOGLE_CLIENT_ID || !value.GOOGLE_CLIENT_SECRET) {
        context.addIssue({
          code: 'custom',
          path: ['GOOGLE_CLIENT_ID'],
          message: 'Google credentials are required in production',
        });
      }
      const web = new URL(value.WEB_ORIGIN);
      const api = new URL(value.API_PUBLIC_ORIGIN);
      const webDomain = getDomain(web.hostname);
      if (
        web.protocol !== 'https:' ||
        api.protocol !== 'https:' ||
        !webDomain ||
        webDomain !== getDomain(api.hostname)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['API_PUBLIC_ORIGIN'],
          message: 'Production origins must use HTTPS on the same site',
        });
      }
    }
  });

export type ApiEnv = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  constructor(keys: string[]) {
    super(`Variáveis de ambiente inválidas: ${keys.join(', ')}`);
    this.name = 'EnvValidationError';
  }
}

export function parseEnv(input: NodeJS.ProcessEnv): ApiEnv {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    const keys = [
      ...new Set(
        result.error.issues.map(
          (issue) => issue.path.join('.') || 'environment',
        ),
      ),
    ];
    throw new EnvValidationError(keys);
  }
  return result.data;
}

export function loadEnv(): ApiEnv {
  dotenv.config({ path: rootEnvPath, quiet: true });
  return parseEnv(process.env);
}
