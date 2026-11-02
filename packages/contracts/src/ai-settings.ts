import { z } from 'zod';

export const aiProviderSchema = z.enum([
  'gemini',
  'claude',
  'openai',
  'deepseek',
  'kimi',
]);
export type AIProvider = z.infer<typeof aiProviderSchema>;
export const aiModels = {
  gemini: ['gemini-3.8-flash'],
  claude: ['claude-sonnet-4-6'],
  openai: ['gpt-4.1-mini', 'gpt-4.1'],
  deepseek: ['deepseek-flash', 'deepseek-v4-pro'],
  kimi: ['kimi-k3.1-pro'],
} as const;
export const isAIModel = (provider: AIProvider, model: string): boolean =>
  (aiModels[provider] as readonly string[]).includes(model);
export const aiKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(4096)
  .refine(
    (value) =>
      !Array.from(value).some(
        (character) =>
          character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      ),
    'Credencial inválida.',
  );
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const aiSettingsWriteSchema = z.discriminatedUnion('mode', [
  z.strictObject({ mode: z.literal('platform'), revision }),
  z
    .strictObject({
      mode: z.literal('personal'),
      revision,
      provider: aiProviderSchema,
      model: z.string().min(1).max(100),
      apiKey: aiKeySchema.optional(),
    })
    .refine((input) => isAIModel(input.provider, input.model), {
      path: ['model'],
      message: 'Modelo incompatível.',
    }),
]);
export const aiSettingsDeleteSchema = z.strictObject({ revision });
export const aiSettingsSchema = z.strictObject({
  mode: z.enum(['platform', 'personal']),
  provider: aiProviderSchema,
  model: z.string().max(100).nullable(),
  hasPersonalKey: z.boolean(),
  platformAvailable: z.boolean(),
  revision,
});
export const aiCatalogSchema = z.strictObject({
  providers: z
    .array(
      z.strictObject({
        id: aiProviderSchema,
        label: z.string(),
        models: z.array(z.string()).min(1),
      }),
    )
    .length(5),
  limits: z.strictObject({
    userPerMinute: z.number().int().positive(),
    userConcurrency: z.number().int().positive(),
    platformUserDaily: z.number().int().positive(),
  }),
});
export type AISettingsWrite = z.infer<typeof aiSettingsWriteSchema>;
export type AISettings = z.infer<typeof aiSettingsSchema>;
export type AICatalog = z.infer<typeof aiCatalogSchema>;
