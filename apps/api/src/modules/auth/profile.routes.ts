import { webOrigins, allowsWebOrigin } from '../../config/origins.js';
import {
  emailChangeSchema,
  emailCodeSchema,
  identityProofSchema,
  passwordChangeSchema,
  preferencesUpdateSchema,
  profileUpdateSchema,
} from '@study-platform/contracts';
import express, { Router } from 'express';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import type { AuthService } from './auth.service.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from './auth.routes.js';
import { ProfileService } from './profile.service.js';
import { PreferencesService } from '../preferences/preferences.service.js';
import { MAX_AVATAR_BYTES, processAvatar } from './avatar.js';
import type { ZodType } from 'zod';

function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new HttpError(
      400,
      'INVALID_INPUT',
      'Verifique os campos informados.',
    );
  return result.data;
}
export function profileRoutes(
  auth: AuthService,
  profile: ProfileService,
  preferences: PreferencesService,
  env: ApiEnv,
): Router {
  const router = Router();
  router.use(requireSession(auth, env));
  const write = requireOrigin(webOrigins(env));
  router.get('/', async (_req, res) => {
    res.json(await profile.read(authenticatedSession(res).userId));
  });
  router.patch('/', write, async (req, res) => {
    res.json(
      await profile.updateName(
        authenticatedSession(res).userId,
        parse(profileUpdateSchema, req.body).displayName,
      ),
    );
  });
  router.get('/avatar', async (_req, res) => {
    res.set({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-site',
    });
    const bytes = await profile.avatar(authenticatedSession(res).userId);
    if (!bytes) {
      res.status(204).end();
      return;
    }
    res.type('image/webp').send(bytes);
  });
  router.put(
    '/avatar',
    (req, _res, next) => {
      if (!allowsWebOrigin(env, req.headers.origin))
        return next(
          new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origem não permitida.'),
        );
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(
          req.headers['content-type'] ?? '',
        )
      )
        return next(
          new HttpError(415, 'INVALID_AVATAR', 'Envie JPEG, PNG ou WebP.'),
        );
      next();
    },
    express.raw({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      limit: MAX_AVATAR_BYTES,
    }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body))
        throw new HttpError(400, 'INVALID_AVATAR', 'Envie uma imagem válida.');
      const bytes = await processAvatar(req.body, req.headers['content-type']!);
      res.json(
        await profile.saveAvatar(authenticatedSession(res).userId, bytes),
      );
    },
  );
  router.delete('/avatar', write, async (_req, res) => {
    res.json(await profile.saveAvatar(authenticatedSession(res).userId, null));
  });
  router.post('/identity/password', write, async (req, res) => {
    await profile.provePassword(
      authenticatedSession(res),
      parse(identityProofSchema, req.body).currentPassword,
      req.ip ?? 'unknown',
    );
    res.status(204).end();
  });
  router.post('/email/request', write, async (req, res) => {
    await profile.requestEmail(
      authenticatedSession(res),
      parse(emailChangeSchema, req.body).email,
      req.ip ?? 'unknown',
    );
    res.status(202).json({ expiresInSeconds: 600, resendAfterSeconds: 60 });
  });
  router.post('/email/resend', write, async (req, res) => {
    await profile.resend(authenticatedSession(res), req.ip ?? 'unknown');
    res.status(202).json({ expiresInSeconds: 600, resendAfterSeconds: 60 });
  });
  router.post('/email/confirm', write, async (req, res) => {
    await auth.email.limitValidation('change_email', req.ip ?? 'unknown');
    await profile.confirm(
      authenticatedSession(res),
      parse(emailCodeSchema, req.body).code,
    );
    res.status(204).end();
  });
  router.post('/password', write, async (req, res) => {
    const input = parse(passwordChangeSchema, req.body);
    await profile.changePassword(
      authenticatedSession(res),
      input.currentPassword,
      input.password,
      req.ip ?? 'unknown',
    );
    res.status(204).end();
  });
  router.get('/preferences', async (_req, res) => {
    res.json(await preferences.read(authenticatedSession(res).userId));
  });
  router.patch('/preferences', write, async (req, res) => {
    res.json(
      await preferences.update(
        authenticatedSession(res).userId,
        parse(preferencesUpdateSchema, req.body),
      ),
    );
  });
  return router;
}
