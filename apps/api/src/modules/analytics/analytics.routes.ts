import { Router } from 'express';
import type { AuthService } from '../auth/auth.service.js';
import { authenticatedSession, requireSession } from '../auth/auth.routes.js';
import type { ApiEnv } from '../../config/env.js';
import type { AnalyticsService } from './analytics.service.js';
export function analyticsRoutes(
  auth: AuthService,
  service: AnalyticsService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env));
  router.get('/study', async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(await service.read(authenticatedSession(res).userId, req.query));
  });
  return router;
}
