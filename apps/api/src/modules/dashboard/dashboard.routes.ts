import { Router } from 'express';
import type { AuthService } from '../auth/auth.service.js';
import { requireSession, authenticatedSession } from '../auth/auth.routes.js';
import type { ApiEnv } from '../../config/env.js';
import type { DashboardService } from './dashboard.service.js';
import { HttpError } from '../../shared/http-error.js';
export function dashboardRoutes(
  auth: AuthService,
  dashboard: DashboardService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env));
  router.get('/', async (req, res) => {
    if (Object.keys(req.query).length)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'O dashboard usa a conta autenticada.',
      );
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(await dashboard.read(authenticatedSession(res).userId));
  });
  return router;
}
