import { Router } from 'express';
import { aiSettingsDeleteSchema } from '@study-platform/contracts';
import type { AuthService } from '../auth/auth.service.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import { webOrigins } from '../../config/origins.js';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import type { AISettingsService } from './ai-settings.service.js';

export function aiSettingsRoutes(
  auth: AuthService,
  service: AISettingsService,
  env: ApiEnv,
) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(requireSession(auth, env));
  router.get('/catalog', (_req, res) => {
    res.json(service.catalog());
  });
  router.get('/', async (_req, res) => {
    res.json(await service.read(authenticatedSession(res).userId));
  });
  router.put('/', requireOrigin(webOrigins(env)), async (req, res) => {
    res.json(await service.update(authenticatedSession(res).userId, req.body));
  });
  router.delete('/', requireOrigin(webOrigins(env)), async (req, res) => {
    const parsed = aiSettingsDeleteSchema.safeParse(req.body);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Informe a revisão atual.');
    res.json(
      await service.update(authenticatedSession(res).userId, {
        mode: 'platform',
        revision: parsed.data.revision,
      }),
    );
  });
  return router;
}
