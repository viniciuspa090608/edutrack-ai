import { z } from 'zod';
export * from './tasks.js';

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
  displayName: z.string().optional(),
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

export const displayNameSchema = z
  .string()
  .refine((s) => !/\p{Cc}/u.test(s), 'Não use caracteres de controle.')
  .transform((s) => s.normalize('NFC').trim())
  .refine(
    (s) =>
      Array.from(s).length >= 2 &&
      Array.from(s).length <= 60 &&
      !/\p{Cc}/u.test(s),
    'Use de 2 a 60 caracteres, sem caracteres de controle.',
  );
export const profileUpdateSchema = z
  .object({ displayName: displayNameSchema })
  .strict();
const preferencesObjectSchema = z
  .object({
    tasks: z.boolean(),
    subjects: z.boolean(),
    flashcards: z.boolean(),
    ai: z.boolean(),
  })
  .strict();
export function hasEnabledStudyModule(value: {
  tasks: boolean;
  subjects: boolean;
  flashcards: boolean;
}): boolean {
  return value.tasks || value.subjects || value.flashcards;
}
export const preferencesSchema = preferencesObjectSchema.refine(
  hasEnabledStudyModule,
  'Mantenha pelo menos um módulo de estudo ativo.',
);
export const preferencesUpdateSchema = preferencesObjectSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0);
export const profileSchema = authUserSchema
  .extend({
    displayName: displayNameSchema,
    emailVerified: z.boolean(),
    localPassword: z.boolean(),
    avatarVersion: z.string().nullable(),
  })
  .strict();
export const identityProofSchema = z
  .object({ currentPassword: z.string().min(1).max(128) })
  .strict();
export const emailChangeSchema = z.object({ email: emailSchema }).strict();
export const passwordChangeSchema = identityProofSchema
  .extend({ password: registerRequestSchema.shape.password })
  .strict();
export type UserProfile = z.infer<typeof profileSchema>;
export type ModulePreferences = z.infer<typeof preferencesSchema>;
export type Capability = keyof ModulePreferences;
export * from './pomodoro.js';
export * from './routines.js';

export * from './subjects.js';

export * from './roadmaps.js';
export * from './roadmap-revisions.js';

export * from './flashcards.js';
export * from './flashcard-import.js';
export * from './reviews.js';
export * from './flashcard-ai.js';
