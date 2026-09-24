import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(320));

export const registerRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(12).max(128),
  })
  .strict();

export const loginRequestSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1),
  })
  .strict();

export const authUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  googleLinked: z.boolean(),
});

export const meResponseSchema = z.object({ user: authUserSchema });
export const authSuccessResponseSchema = meResponseSchema;

export const authErrorCodeSchema = z.enum([
  'INVALID_INPUT',
  'EMAIL_UNAVAILABLE',
  'INVALID_CREDENTIALS',
  'TOO_MANY_ATTEMPTS',
  'UNAUTHENTICATED',
  'GOOGLE_CONFLICT',
  'GOOGLE_FAILED',
  'ORIGIN_NOT_ALLOWED',
]);

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
