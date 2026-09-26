import { profileSchema, preferencesSchema } from '@study-platform/contracts';
import type { ModulePreferences, UserProfile } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';

export async function profile(): Promise<UserProfile> {
  return profileSchema.parse(await (await send('/profile')).json());
}
export async function preferences(): Promise<ModulePreferences> {
  return preferencesSchema.parse(
    await (await send('/profile/preferences')).json(),
  );
}
export async function action(
  path: string,
  body: object = {},
  method = 'POST',
): Promise<Response> {
  return send(`/profile${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
export async function updateName(displayName: string): Promise<UserProfile> {
  return profileSchema.parse(
    await (await action('', { displayName }, 'PATCH')).json(),
  );
}
export async function updatePreferences(
  input: Partial<ModulePreferences>,
): Promise<ModulePreferences> {
  return preferencesSchema.parse(
    await (await action('/preferences', input, 'PATCH')).json(),
  );
}
export async function avatar(): Promise<Blob | null> {
  const res = await send('/profile/avatar');
  return res.status === 204 ? null : res.blob();
}
export async function uploadAvatar(file: File): Promise<UserProfile> {
  return profileSchema.parse(
    await (
      await send('/profile/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
    ).json(),
  );
}
export async function removeAvatar(): Promise<UserProfile> {
  return profileSchema.parse(
    await (await action('/avatar', {}, 'DELETE')).json(),
  );
}
export async function googleReauth(): Promise<string> {
  const res = await send('/auth/google/reauth/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body: unknown = await res.json();
  if (
    !body ||
    typeof body !== 'object' ||
    !('url' in body) ||
    typeof body.url !== 'string'
  )
    throw new Error('Resposta inválida.');
  return body.url;
}
