import { webOrigins } from '../../config/origins.js';
import { Router } from 'express';
import type { AuthService } from '../auth/auth.service.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import type { StudyProgressService } from './study-progress.service.js';
export function studyProgressRoutes(
  auth: AuthService,
  service: StudyProgressService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(
    ['/study-progress', '/account/study-timezone'],
    requireSession(auth, env),
  );
  router.use(
    ['/study-progress', '/account/study-timezone'],
    (_req, res, next) => {
      res.setHeader('Cache-Control', 'private, no-store');
      next();
    },
  );
  const noQuery = (query: object) => {
    if (Object.keys(query).length)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'A consulta usa somente a conta autenticada.',
      );
  };
  router.get('/study-progress', async (req, res) => {
    noQuery(req.query);
    res.json(await service.read(authenticatedSession(res).userId));
  });
  router.get('/account/study-timezone', async (req, res) => {
    noQuery(req.query);
    res.json(await service.settings(authenticatedSession(res).userId));
  });
  router.patch(
    '/account/study-timezone',
    requireOrigin(webOrigins(env)),
    async (req, res) => {
      noQuery(req.query);
      res.json(
        await service.changeTimeZone(
          authenticatedSession(res).userId,
          req.body,
        ),
      );
    },
  );
  return router;
}
