import {
  assistantAvailabilitySchema,
  assistantConversationsSchema,
  assistantMessagesSchema,
  type AssistantConversations,
} from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';

const query = (cursor?: AssistantConversations['cursor']) =>
  cursor ? `?${new URLSearchParams(cursor)}` : '';

export async function assistantAvailability() {
  return assistantAvailabilitySchema.parse(
    await (await send('/assistant/availability')).json(),
  );
}
export async function assistantConversations(
  cursor?: AssistantConversations['cursor'],
) {
  return assistantConversationsSchema.parse(
    await (await send(`/assistant/conversations${query(cursor)}`)).json(),
  );
}
export async function assistantMessages(
  id: string,
  cursor?: AssistantConversations['cursor'],
) {
  return assistantMessagesSchema.parse(
    await (
      await send(`/assistant/conversations/${id}/messages${query(cursor)}`)
    ).json(),
  );
}
export async function assistantPost(
  path: '/messages' | '/confirmations',
  body: object,
) {
  await send(`/assistant${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
