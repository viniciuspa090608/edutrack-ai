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
import type { RoadmapRevisionsService } from './roadmap-revisions.service.js';
export function roadmapRevisionRoutes(
  auth: AuthService,
  service: RoadmapRevisionsService,
  prefs: PreferencesService,
  env: ApiEnv,
) {
  const router = Router(),
    guards = [
      requireSession(auth, env),
      prefs.guard('subjects'),
      requireOrigin(webOrigins(env)),
    ];
  const id = (value: unknown) => {
    const parsed = subjectSchema.shape.id.safeParse(value);
    if (!parsed.success)
      throw new HttpError(404, 'ROADMAP_NOT_FOUND', 'Roadmap não encontrado.');
    return parsed.data;
  };
  for (const [path, action] of [
    ['step-regenerations', 'generate'],
    ['restoration-previews', 'restore'],
    ['revision-confirmations', 'confirm'],
  ] as const)
    router.post(
      `/:id/roadmaps/:roadmapId/${path}`,
      ...guards,
      async (req, res) => {
        res.setHeader('Cache-Control', 'private, no-store');
        res
          .status(action === 'confirm' ? 201 : 200)
          .json(
            await service[action](
              authenticatedSession(res).userId,
              id(req.params.id),
              id(req.params.roadmapId),
              req.body,
            ),
          );
      },
    );
  return router;
}
