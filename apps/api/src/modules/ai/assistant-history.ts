import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import {
  assistantActionSchema,
  type AssistantAction,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';

const retention = 30 * 24 * 60 * 60 * 1000;
type Page = { limit: number; cursor?: { at: string; id: string } | undefined };
type Send = {
  conversationId?: string | undefined;
  messageId: string;
  attemptId: string;
  text: string;
};
type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  body: string;
  created_at: Date;
  expires_at: Date;
  preview_id?: string;
  idempotency_key?: string;
  action?: unknown;
  destination?: string;
  confirmed?: number;
  answered?: number;
  pending?: number;
};
type Attempt = {
  message_id: string;
  status: 'pending' | 'failed' | 'completed';
  deadline: Date;
};

const missing = () =>
  new HttpError(
    404,
    'ASSISTANT_NOT_FOUND',
    'Conversa ou mensagem indisponível.',
  );
const conflict = () =>
  new HttpError(
    409,
    'ASSISTANT_CONFLICT',
    'A mensagem já possui uma tentativa.',
  );

export class AssistantHistory {
  constructor(
    private readonly source: DataSource,
    private readonly timeoutMs: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async conversations(userId: string, page: Page) {
    return this.source.query<Array<{ id: string; updated_at: Date }>>(
      `SELECT c.id, c.updated_at FROM assistant_conversations c
       WHERE c.user_id = ? AND EXISTS (
         SELECT 1 FROM assistant_messages m WHERE m.user_id = c.user_id
           AND m.conversation_id = c.id AND m.expires_at > ?
       )
       ${page.cursor ? 'AND (c.updated_at, c.id) < (?, ?)' : ''}
       ORDER BY c.updated_at DESC, c.id DESC LIMIT ?`,
      [
        userId,
        this.now(),
        ...(page.cursor ? [new Date(page.cursor.at), page.cursor.id] : []),
        page.limit + 1,
      ],
    );
  }

  async messages(userId: string, conversationId: string, page: Page) {
    const now = this.now();
    const rows = await this.source.query<Message[]>(
      `SELECT m.id, m.conversation_id, m.role, m.body, m.created_at, m.expires_at,
         p.id AS preview_id, p.idempotency_key, p.action, p.destination,
         (r.preview_id IS NOT NULL) AS confirmed,
         EXISTS (SELECT 1 FROM assistant_attempts a WHERE a.user_id = m.user_id
           AND a.message_id = m.id AND a.status = 'completed') AS answered,
         EXISTS (SELECT 1 FROM assistant_attempts a WHERE a.user_id = m.user_id
           AND a.message_id = m.id AND a.status = 'pending' AND a.deadline > ?) AS pending
       FROM assistant_messages m
       LEFT JOIN assistant_previews p ON p.user_id = m.user_id AND p.reply_id = m.id AND p.expires_at > ?
       LEFT JOIN assistant_receipts r ON r.user_id = p.user_id AND r.preview_id = p.id
       WHERE m.user_id = ? AND m.conversation_id = ? AND m.expires_at > ?
       ${page.cursor ? 'AND (m.created_at, m.id) < (?, ?)' : ''}
       ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
      [
        now,
        now,
        userId,
        conversationId,
        now,
        ...(page.cursor ? [new Date(page.cursor.at), page.cursor.id] : []),
        page.limit + 1,
      ],
    );
    if (!rows.length) {
      const [visible] = await this.source.query<Array<{ id: string }>>(
        `SELECT id FROM assistant_messages
         WHERE user_id = ? AND conversation_id = ? AND expires_at > ? LIMIT 1`,
        [userId, conversationId, now],
      );
      if (!visible) throw missing();
    }
    return rows;
  }

  private async lockAccount(manager: EntityManager, userId: string) {
    const users = await manager.query<Array<{ id: string }>>(
      'SELECT id FROM users WHERE id = ? FOR UPDATE',
      [userId],
    );
    if (!users.length) throw missing();
  }

  async begin(userId: string, input: Send) {
    return this.source.transaction(async (manager) => {
      await this.lockAccount(manager, userId);
      const now = this.now();
      const [previous] = await manager.query<Message[]>(
        'SELECT * FROM assistant_messages WHERE user_id = ? AND id = ? FOR UPDATE',
        [userId, input.messageId],
      );
      if (previous && previous.expires_at <= now) throw missing();
      if (
        previous &&
        (previous.role !== 'user' ||
          previous.body !== input.text ||
          (input.conversationId &&
            input.conversationId !== previous.conversation_id))
      )
        throw conflict();
      const [attempt] = await manager.query<Attempt[]>(
        'SELECT * FROM assistant_attempts WHERE user_id = ? AND id = ?',
        [userId, input.attemptId],
      );
      if (attempt) {
        if (!previous || attempt.message_id !== previous.id) throw conflict();
        return { conversationId: previous.conversation_id, started: false };
      }
      const conversationId =
        previous?.conversation_id ?? input.conversationId ?? input.messageId;
      if (!previous && input.conversationId) {
        const [conversation] = await manager.query<Array<{ id: string }>>(
          `SELECT id FROM assistant_conversations c WHERE c.user_id = ? AND c.id = ?
           AND EXISTS (SELECT 1 FROM assistant_messages m WHERE m.user_id = c.user_id
             AND m.conversation_id = c.id AND m.expires_at > ?) FOR UPDATE`,
          [userId, conversationId, now],
        );
        if (!conversation) throw missing();
      }
      if (previous) {
        const [active] = await manager.query<Attempt[]>(
          `SELECT status FROM assistant_attempts WHERE user_id = ? AND message_id = ?
           AND (status = 'completed' OR (status = 'pending' AND deadline > ?)) LIMIT 1`,
          [userId, input.messageId, now],
        );
        if (active) throw conflict();
        await manager.query(
          `UPDATE assistant_attempts SET status = 'failed', error_code = 'AI_TIMEOUT'
           WHERE user_id = ? AND message_id = ? AND status = 'pending'`,
          [userId, input.messageId],
        );
      } else {
        if (!input.conversationId)
          await manager.query(
            'INSERT INTO assistant_conversations (user_id, id, updated_at) VALUES (?, ?, ?)',
            [userId, conversationId, now],
          );
        await manager.query(
          `INSERT INTO assistant_messages
           (user_id, id, conversation_id, role, body, created_at, expires_at)
           VALUES (?, ?, ?, 'user', ?, ?, ?)`,
          [
            userId,
            input.messageId,
            conversationId,
            input.text,
            now,
            new Date(now.getTime() + retention),
          ],
        );
        await manager.query(
          'UPDATE assistant_conversations SET updated_at = ? WHERE user_id = ? AND id = ?',
          [now, userId, conversationId],
        );
      }
      await manager.query(
        `INSERT INTO assistant_attempts (user_id, id, message_id, status, deadline)
         VALUES (?, ?, ?, 'pending', ?)`,
        [
          userId,
          input.attemptId,
          input.messageId,
          new Date(now.getTime() + this.timeoutMs + 10_000),
        ],
      );
      return { conversationId, started: true };
    });
  }

  async fail(userId: string, attemptId: string, code: string) {
    await this.source.query(
      `UPDATE assistant_attempts SET status = 'failed', error_code = ?
       WHERE user_id = ? AND id = ? AND status = 'pending'`,
      [code, userId, attemptId],
    );
  }

  async confirm(
    userId: string,
    previewId: string,
    key: string,
    apply: (
      manager: EntityManager,
      action: AssistantAction,
      replay: boolean,
    ) => Promise<unknown>,
  ) {
    return this.source.transaction(async (manager) => {
      await this.lockAccount(manager, userId);
      const [preview] = await manager.query<Array<{ action: unknown }>>(
        `SELECT action FROM assistant_previews WHERE user_id = ? AND id = ?
         AND idempotency_key = ? AND expires_at > ? FOR UPDATE`,
        [userId, previewId, key, this.now()],
      );
      if (!preview) throw missing();
      const [receipt] = await manager.query<Array<{ result: unknown }>>(
        'SELECT result FROM assistant_receipts WHERE user_id = ? AND preview_id = ?',
        [userId, previewId],
      );
      const action = assistantActionSchema.parse(
        typeof preview.action === 'string'
          ? JSON.parse(preview.action)
          : preview.action,
      );
      const result = await apply(manager, action, Boolean(receipt));
      if (receipt)
        return typeof receipt.result === 'string'
          ? (JSON.parse(receipt.result) as unknown)
          : receipt.result;
      await manager.query(
        'INSERT INTO assistant_receipts (user_id, preview_id, result) VALUES (?, ?, ?)',
        [userId, previewId, JSON.stringify(result)],
      );
      return result;
    });
  }

  async finish(
    userId: string,
    attemptId: string,
    body: string,
    preview?: { action: AssistantAction; destination: string },
  ) {
    return this.source.transaction(async (manager) => {
      await this.lockAccount(manager, userId);
      const now = this.now();
      const [origin] = await manager.query<Message[]>(
        `SELECT m.* FROM assistant_attempts a
         JOIN assistant_messages m ON m.user_id = a.user_id AND m.id = a.message_id
         WHERE a.user_id = ? AND a.id = ? AND a.status = 'pending'
           AND a.deadline > ? AND m.expires_at > ? FOR UPDATE`,
        [userId, attemptId, now, now],
      );
      if (!origin) throw conflict();
      const replyId = randomUUID();
      await manager.query(
        `INSERT INTO assistant_messages
         (user_id, id, conversation_id, role, body, created_at, expires_at)
         VALUES (?, ?, ?, 'assistant', ?, ?, ?)`,
        [
          userId,
          replyId,
          origin.conversation_id,
          body,
          now,
          new Date(now.getTime() + retention),
        ],
      );
      await manager.query(
        `UPDATE assistant_attempts SET status = 'completed', reply_id = ?
         WHERE user_id = ? AND id = ?`,
        [replyId, userId, attemptId],
      );
      await manager.query(
        'UPDATE assistant_conversations SET updated_at = ? WHERE user_id = ? AND id = ?',
        [now, userId, origin.conversation_id],
      );
      if (!preview) return { replyId };
      const previewId = randomUUID();
      const idempotencyKey = randomUUID();
      await manager.query(
        `INSERT INTO assistant_previews
         (user_id, id, message_id, reply_id, idempotency_key, action, destination, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          previewId,
          origin.id,
          replyId,
          idempotencyKey,
          JSON.stringify(preview.action),
          preview.destination,
          origin.expires_at,
        ],
      );
      return { replyId, previewId, idempotencyKey };
    });
  }
}
