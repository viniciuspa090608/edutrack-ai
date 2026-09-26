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

export const emailCodeSchema = z
  .object({ code: z.string().regex(/^\d{6}$/) })
  .strict();
export const recoveryRequestSchema = z.object({ email: emailSchema }).strict();
export const recoveryVerifySchema = recoveryRequestSchema
  .extend({ code: emailCodeSchema.shape.code })
  .strict();
export const passwordResetSchema = z
  .object({ password: registerRequestSchema.shape.password })
  .strict();
export const pendingVerificationSchema = z.object({
  pendingVerification: z.literal(true),
});
export const recoveryRequestedSchema = z.object({ message: z.string() });

export const authUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  googleLinked: z.boolean(),
});

export const meResponseSchema = z.object({ user: authUserSchema });
export const authSuccessResponseSchema = z.union([
  meResponseSchema,
  pendingVerificationSchema,
]);

export const authErrorCodeSchema = z.enum([
  'INVALID_INPUT',
  'EMAIL_UNAVAILABLE',
  'INVALID_CREDENTIALS',
  'TOO_MANY_ATTEMPTS',
  'UNAUTHENTICATED',
  'GOOGLE_CONFLICT',
  'GOOGLE_FAILED',
  'ORIGIN_NOT_ALLOWED',
  'EMAIL_VERIFICATION_REQUIRED',
  'EMAIL_RATE_LIMITED',
  'INVALID_CODE',
  'INVALID_RESET_GRANT',
]);

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
