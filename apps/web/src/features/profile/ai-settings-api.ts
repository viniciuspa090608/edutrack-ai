import { aiCatalogSchema, aiSettingsSchema } from '@study-platform/contracts';
import type { AISettingsWrite } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';

export async function readAISettings() {
  return aiSettingsSchema.parse(await (await send('/profile/ai')).json());
}
export async function readAICatalog() {
  return aiCatalogSchema.parse(
    await (await send('/profile/ai/catalog')).json(),
  );
}
export async function saveAISettings(input: AISettingsWrite) {
  return aiSettingsSchema.parse(
    await (
      await send('/profile/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    ).json(),
  );
}
export async function removeAISettings(revision: number) {
  return aiSettingsSchema.parse(
    await (
      await send('/profile/ai', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revision }),
      })
    ).json(),
  );
}
