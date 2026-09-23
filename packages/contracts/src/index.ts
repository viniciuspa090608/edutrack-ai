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
