import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const rootEnvPath = fileURLToPath(new URL('../../../../.env', import.meta.url));

const port = z.coerce.number().int().min(1).max(65535);

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
    WEB_ORIGIN: z.url().refine(
      (value) => {
        const url = new URL(value);
        return (
          ['http:', 'https:'].includes(url.protocol) && url.origin === value
        );
      },
      { message: 'must be an HTTP(S) origin without a path' },
    ),
  })
  .refine((value) => value.DB_NAME !== value.TEST_DB_NAME, {
    path: ['TEST_DB_NAME'],
    message: 'must differ from DB_NAME',
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
