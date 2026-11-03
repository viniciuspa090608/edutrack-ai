import { Router } from 'express';
import { z } from 'zod';
import {
  classroomConsentSchema,
  classroomPaginationSchema,
  onboardingStateSchema,
  onboardingUpdateSchema,
} from '@study-platform/contracts';
import type { AuthService } from '../auth/auth.service.js';
import {
  authenticatedSession,
  readCookie,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import { webOrigins } from '../../config/origins.js';
import type { ClassroomService } from './classroom.service.js';
import { inputErrors } from '../../shared/input-errors.js';

export function classroomRoutes(auth: AuthService, service: ClassroomService) {
  const router = Router(),
    env = service.env;
  router.use(requireSession(auth, env));
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });
  const write = requireOrigin(webOrigins(env));
  const cookieName =
    env.NODE_ENV === 'production'
      ? '__Host-edutrack_classroom'
      : 'edutrack_classroom';
  router.get('/connection', async (_req, res) => {
    res.json(await service.status(authenticatedSession(res).userId));
  });
  router.post('/connect', write, async (req, res) => {
    const input = classroomConsentSchema.parse(req.body);
    const result = await service.connect(
      authenticatedSession(res),
      input.purpose,
    );
    res.cookie(cookieName, result.browserSecret, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600000,
    });
    res.json({ url: result.url });
  });
  router.get('/callback', async (req, res) => {
    let outcome = 'connected';
    try {
      await service.oauth.callback(
        authenticatedSession(res),
        new URL(`${env.API_PUBLIC_ORIGIN}${req.originalUrl}`),
        readCookie(req, cookieName),
      );
    } catch {
      outcome = 'failed';
    }
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    res.redirect(
      `${env.WEB_ORIGIN}/conta?classroom=${outcome}#account-integrations`,
    );
  });
  router.delete('/connection', write, async (_req, res) => {
    res.json(await service.oauth.disconnect(authenticatedSession(res).userId));
  });
  router.get('/courses', async (req, res) => {
    const token = z.string().max(4096).optional().parse(req.query.pageToken);
    res.json(await service.courses(authenticatedSession(res).userId, token));
  });
  router.get('/selection', async (_req, res) => {
    res.json(await service.selection(authenticatedSession(res).userId));
  });
  router.put('/selection', write, async (req, res) => {
    res.json(await service.select(authenticatedSession(res).userId, req.body));
  });
  router.post('/imports', write, async (req, res) => {
    res
      .status(202)
      .json(
        await service.start(
          authenticatedSession(res).userId,
          'import',
          req.body,
        ),
      );
  });
  router.get('/operations', async (_req, res) => {
    res.json(await service.operations.latest(authenticatedSession(res).userId));
  });
  router.get('/operations/:id', async (req, res) => {
    const q = classroomPaginationSchema.parse(req.query);
    res.json(
      await service.operations.result(
        authenticatedSession(res).userId,
        z.uuid().parse(req.params.id),
        q.page,
        q.pageSize,
      ),
    );
  });
  router.post('/operations/:id/retry', write, async (req, res) => {
    res
      .status(202)
      .json(
        await service.retry(
          authenticatedSession(res).userId,
          z.uuid().parse(req.params.id),
        ),
      );
  });
  router.use(inputErrors);
  return router;
}
export function onboardingRoutes(auth: AuthService, service: ClassroomService) {
  const router = Router();
  router.use(requireSession(auth, service.env));
  router.get('/', async (_req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(
      onboardingStateSchema.parse(
        await service.onboarding(authenticatedSession(res).userId),
      ),
    );
  });
  router.patch(
    '/',
    requireOrigin(webOrigins(service.env)),
    async (req, res) => {
      const { step } = onboardingUpdateSchema.parse(req.body);
      res.json(
        await service.updateOnboarding(authenticatedSession(res).userId, step),
      );
    },
  );
  router.use(inputErrors);
  return router;
}
