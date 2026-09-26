import { Router } from 'express';
import {
  pomodoroSessionSchema,
  pomodoroConflictSchema,
} from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { AuthService } from '../auth/auth.service.js';
import { PomodoroConflict, PomodoroService } from './pomodoro.service.js';

export function pomodoroRoutes(
  auth: AuthService,
  service: PomodoroService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env));
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });
  const id = (value: unknown) => {
    const parsed = pomodoroSessionSchema.shape.id.safeParse(value);
    if (!parsed.success)
      throw new HttpError(404, 'POMODORO_NOT_FOUND', 'Sessão não encontrada.');
    return parsed.data;
  };
  router.post('/sessions', requireOrigin(env.WEB_ORIGIN), async (req, res) => {
    res
      .status(201)
      .json(await service.start(authenticatedSession(res).userId, req.body));
  });
  router.get('/sessions/current', async (_req, res) => {
    res.json(await service.current(authenticatedSession(res).userId));
  });
  router.get('/sessions', async (req, res) => {
    res.json(
      await service.history(authenticatedSession(res).userId, req.query),
    );
  });
  router.get('/summary', async (_req, res) => {
    res.json(await service.summary(authenticatedSession(res).userId));
  });
  router.get('/sessions/:id', async (req, res) => {
    res.json(
      await service.detail(authenticatedSession(res).userId, id(req.params.id)),
    );
  });
  for (const action of [
    'pause',
    'resume',
    'next-block',
    'cancel',
    'complete',
  ] as const)
    router.post(
      `/sessions/:id/${action}`,
      requireOrigin(env.WEB_ORIGIN),
      async (req, res) => {
        res.json(
          await service.transition(
            authenticatedSession(res).userId,
            id(req.params.id),
            action,
            req.body,
          ),
        );
      },
    );
  router.use(
    (
      error: unknown,
      _req: import('express').Request,
      res: import('express').Response,
      next: import('express').NextFunction,
    ) => {
      if (error instanceof PomodoroConflict)
        res.status(409).json(
          pomodoroConflictSchema.parse({
            error: { code: 'POMODORO_CONFLICT', message: error.message },
            session: error.session,
          }),
        );
      else next(error);
    },
  );
  return router;
}
