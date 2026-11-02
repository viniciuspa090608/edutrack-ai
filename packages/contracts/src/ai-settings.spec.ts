import { expect, it } from 'vitest';
import {
  aiModels,
  aiSettingsSchema,
  aiSettingsWriteSchema,
} from './ai-settings.js';

it('accepts only catalog combinations and write-only bounded keys', () => {
  const base = {
    mode: 'personal',
    revision: 0,
    provider: 'gemini',
    model: aiModels.gemini[0],
  };
  expect(
    aiSettingsWriteSchema.parse({ ...base, apiKey: ' synthetic-key ' }),
  ).toMatchObject({ apiKey: 'synthetic-key' });
  expect(aiSettingsWriteSchema.safeParse(base).success).toBe(true);
  for (const patch of [
    { apiKey: '' },
    { apiKey: ' ' },
    { apiKey: 'a\nb' },
    { apiKey: 'a'.repeat(4097) },
    { model: aiModels.openai[0] },
    { provider: 'other' },
    { url: 'https://example.com' },
    { userId: 'other' },
    { revision: -1 },
  ])
    expect(aiSettingsWriteSchema.safeParse({ ...base, ...patch }).success).toBe(
      false,
    );
  expect(
    aiSettingsWriteSchema.safeParse({
      mode: 'platform',
      revision: 1,
      apiKey: 'secret',
    }).success,
  ).toBe(false);
  expect(
    aiSettingsSchema.safeParse({
      ...base,
      hasPersonalKey: true,
      platformAvailable: false,
      apiKey: 'secret',
    }).success,
  ).toBe(false);
});
