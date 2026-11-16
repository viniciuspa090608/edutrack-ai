import {
  assistantActionSchema,
  assistantConfirmSchema,
  assistantPageSchema,
  assistantSendSchema,
} from '@study-platform/contracts';
import { Router } from 'express';
import { z } from 'zod';
import type { ApiEnv } from '../../config/env.js';
import { webOrigins } from '../../config/origins.js';
import { HttpError } from '../../shared/http-error.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { AuthService } from '../auth/auth.service.js';
import type { AssistantHistory } from './assistant-history.js';
import type { AssistantService } from './assistant.service.js';

function parse<T>(schema: z.ZodType<T>, value: unknown) {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new HttpError(
      400,
      'INVALID_INPUT',
      'Dados do Assistente IA inválidos.',
    );
  return result.data;
}

function paginate<T>(
  rows: T[],
  limit: number,
  cursor: (row: T) => { at: string; id: string },
) {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return { items, cursor: rows.length > limit && last ? cursor(last) : null };
}

export function assistantRoutes(
  auth: AuthService,
  service: AssistantService,
  history: AssistantHistory,
  env: ApiEnv,
) {
  const router = Router();
  router.use(
    (_req, res, next) => {
      res.setHeader('Cache-Control', 'private, no-store');
      next();
    },
    requireSession(auth, env),
  );
  router.get('/availability', async (_req, res) => {
    res.json({
      enabled: await service.available(authenticatedSession(res).userId),
      messageLimit: env.AI_ASSISTANT_MESSAGE_CHARS,
    });
  });
  router.use(async (_req, res, next) => {
    if (!(await service.available(authenticatedSession(res).userId)))
      throw new HttpError(
        403,
        'AI_DISABLED',
        'O Assistente IA está indisponível para esta conta.',
      );
    next();
  });
  router.get('/conversations', async (req, res) => {
    const { at, id, limit } = req.query;
    const page = parse(assistantPageSchema, {
      limit,
      cursor: at || id ? { at, id } : undefined,
    });
    const rows = await history.conversations(
      authenticatedSession(res).userId,
      page,
    );
    res.json(
      paginate(
        rows.map((row) => ({
          id: row.id,
          updatedAt: row.updated_at.toISOString(),
        })),
        page.limit,
        (row) => ({ id: row.id, at: row.updatedAt }),
      ),
    );
  });
  router.get('/conversations/:id/messages', async (req, res) => {
    const { at, id, limit } = req.query;
    const page = parse(assistantPageSchema, {
      limit,
      cursor: at || id ? { at, id } : undefined,
    });
    const rows = await history.messages(
      authenticatedSession(res).userId,
      parse(z.uuid(), req.params.id),
      page,
    );
    res.json(
      paginate(
        rows.map((row) => ({
          id: row.id,
          role: row.role,
          text: row.body,
          createdAt: row.created_at.toISOString(),
          retryable:
            row.role === 'user' &&
            Number(row.answered) === 0 &&
            Number(row.pending) === 0,
          preview: row.preview_id
            ? {
                id: row.preview_id,
                key: row.idempotency_key,
                destination: row.destination,
                action: assistantActionSchema.parse(
                  typeof row.action === 'string'
                    ? JSON.parse(row.action)
                    : row.action,
                ),
                confirmed: Number(row.confirmed) === 1,
              }
            : null,
        })),
        page.limit,
        (row) => ({ id: row.id, at: row.createdAt }),
      ),
    );
  });
  router.post('/messages', requireOrigin(webOrigins(env)), async (req, res) => {
    res.json(
      await service.send(
        authenticatedSession(res).userId,
        parse(assistantSendSchema, req.body),
      ),
    );
  });
  router.post(
    '/confirmations',
    requireOrigin(webOrigins(env)),
    async (req, res) => {
      const session = authenticatedSession(res);
      const input = parse(assistantConfirmSchema, req.body);
      res.json(
        await service.confirm(
          session.userId,
          session.id,
          input.previewId,
          input.idempotencyKey,
        ),
      );
    },
  );
  return router;
}
