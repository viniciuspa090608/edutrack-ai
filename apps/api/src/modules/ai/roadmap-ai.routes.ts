import { webOrigins } from '../../config/origins.js';
import { Router } from 'express';
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
import type { RoadmapAIService } from './roadmap-ai.service.js';
export function roadmapAIRoutes(
  auth: AuthService,
  service: RoadmapAIService,
  prefs: PreferencesService,
  env: ApiEnv,
) {
  const router = Router();
  const guards = [
    requireSession(auth, env),
    prefs.guard('subjects', true),
    requireOrigin(webOrigins(env)),
  ];
  const id = (value: unknown) => {
    const parsed = subjectSchema.shape.id.safeParse(value);
    if (!parsed.success)
      throw new HttpError(404, 'SUBJECT_NOT_FOUND', 'Matéria não encontrada.');
    return parsed.data;
  };
  router.post('/:id/roadmap-generations', ...guards, async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(
      await service.generate(
        authenticatedSession(res).userId,
        id(req.params.id),
        req.body,
      ),
    );
  });
  router.post('/:id/roadmaps/confirm-ai', ...guards, async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res
      .status(201)
      .json(
        await service.confirm(
          authenticatedSession(res).userId,
          id(req.params.id),
          req.body,
        ),
      );
  });
  return router;
}
