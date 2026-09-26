import { Router } from 'express';
import type { Response } from 'express';
import { subjectSchema } from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { AuthService } from '../auth/auth.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { SubjectsService } from './subjects.service.js';
export function subjectsRoutes(
  auth: AuthService,
  service: SubjectsService,
  prefs: PreferencesService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env), prefs.guard('subjects'));
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });
  const owner = (res: Response) => authenticatedSession(res).userId;
  const id = (value: unknown) => {
    const result = subjectSchema.shape.id.safeParse(value);
    if (!result.success)
      throw new HttpError(404, 'SUBJECT_NOT_FOUND', 'Matéria não encontrada.');
    return result.data;
  };
  const write = requireOrigin(env.WEB_ORIGIN);
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
  router.post('/:id/plan-items', write, async (req, res) => {
    res
      .status(201)
      .json(await service.addItem(owner(res), id(req.params.id), req.body));
  });
  router.put('/:id/plan-items/order', write, async (req, res) => {
    res.json(await service.reorder(owner(res), id(req.params.id), req.body));
  });
  router.patch('/:id/plan-items/:itemId', write, async (req, res) => {
    res.json(
      await service.editItem(
        owner(res),
        id(req.params.id),
        id(req.params.itemId),
        req.body,
      ),
    );
  });
  router.delete('/:id/plan-items/:itemId', write, async (req, res) => {
    res.json(
      await service.removeItem(
        owner(res),
        id(req.params.id),
        id(req.params.itemId),
      ),
    );
  });
  return router;
}
