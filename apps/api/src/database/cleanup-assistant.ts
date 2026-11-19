import type { DataSource } from 'typeorm';

export async function cleanupAssistant(source: DataSource) {
  const batchSize = 500;
  const cutoff = new Date();
  const [oldest] = await source.query<Array<{ expires_at: Date }>>(
    'SELECT expires_at FROM assistant_messages WHERE expires_at <= ? ORDER BY expires_at LIMIT 1',
    [cutoff],
  );
  let messages = 0;
  let conversations = 0;
  let removed: number;
  do {
    const result = await source.query<{ affectedRows: number }>(
      `DELETE FROM assistant_messages
       WHERE expires_at <= ? ORDER BY expires_at, user_id, id LIMIT ?`,
      [cutoff, batchSize],
    );
    removed = result.affectedRows;
    messages += removed;
  } while (removed === batchSize);
  do {
    const result = await source.query<{ affectedRows: number }>(
      `DELETE FROM assistant_conversations
       WHERE updated_at <= ?
         AND NOT EXISTS (
           SELECT 1 FROM assistant_messages
           WHERE assistant_messages.user_id = assistant_conversations.user_id
             AND assistant_messages.conversation_id = assistant_conversations.id
         )
       ORDER BY updated_at, user_id, id LIMIT ?`,
      [cutoff, batchSize],
    );
    removed = result.affectedRows;
    conversations += removed;
  } while (removed === batchSize);
  const [remaining] = await source.query<Array<{ total: number | string }>>(
    'SELECT COUNT(*) AS total FROM assistant_messages',
  );
  return {
    messages,
    conversations,
    retainedMessages: Number(remaining?.total ?? 0),
    oldestExpiredMs: oldest
      ? cutoff.getTime() - oldest.expires_at.getTime()
      : 0,
  };
}
