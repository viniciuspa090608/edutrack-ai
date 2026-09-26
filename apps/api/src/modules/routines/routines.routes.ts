import { Router } from 'express';
import type { Response } from 'express';
import { routineSchema } from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { AuthService } from '../auth/auth.service.js';
import type { RoutinesService } from './routines.service.js';
export function routinesRoutes(
  auth: AuthService,
  service: RoutinesService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env));
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });
  const owner = (res: Response) => authenticatedSession(res).userId;
  const id = (value: unknown) => {
    const parsed = routineSchema.shape.id.safeParse(value);
    if (!parsed.success)
      throw new HttpError(404, 'ROUTINE_NOT_FOUND', 'Rotina não encontrada.');
    return parsed.data;
  };
  const write = requireOrigin(env.WEB_ORIGIN);
  router.get('/schedule', async (_req, res) => {
    res.json(await service.schedule(owner(res)));
  });
  router.get('/', async (req, res) => {
    res.json(await service.list(owner(res), req.query));
  });
  router.post('/', write, async (req, res) => {
    res.status(201).json(await service.create(owner(res), req.body));
  });
  router.get('/:id', async (req, res) => {
    res.json(await service.detail(owner(res), id(req.params.id)));
  });
  router.patch('/:id', write, async (req, res) => {
    res.json(await service.update(owner(res), id(req.params.id), req.body));
  });
  router.delete('/:id', write, async (req, res) => {
    await service.delete(owner(res), id(req.params.id));
    res.status(204).end();
  });
  return router;
}
