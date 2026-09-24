import {
  loginRequestSchema,
  registerRequestSchema,
} from '@study-platform/contracts';
import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import { AuthService } from './auth.service.js';
import { allowedReturnTo, GoogleService } from './google.service.js';
import type { ActiveSession } from './session.repository.js';

export function sessionCookieName(env: ApiEnv): string {
  return env.NODE_ENV === 'production'
    ? '__Host-edutrack_session'
    : 'edutrack_session';
}

export function readCookie(request: Request, name: string): string | undefined {
  const raw = request.headers.cookie;
  return raw
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function setSessionCookie(
  response: Response,
  env: ApiEnv,
  token: string,
): void {
  response.cookie(sessionCookieName(env), token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookie(response: Response, env: ApiEnv): void {
  response.clearCookie(sessionCookieName(env), {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export function requireOrigin(webOrigin: string): RequestHandler {
  return (request, _response, next) => {
    if (request.headers.origin !== webOrigin) {
      next(new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origem não permitida.'));
      return;
    }
    if (!request.is('application/json')) {
      next(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Envie JSON.'));
      return;
    }
    next();
  };
}

export function requireSession(
  service: AuthService,
  env: ApiEnv,
): RequestHandler {
  return async (request, response, next) => {
    try {
      await service.sessions.cleanup();
      const token = readCookie(request, sessionCookieName(env));
      const session = token ? await service.sessions.resolve(token) : null;
      if (!session)
        throw new HttpError(401, 'UNAUTHENTICATED', 'Entre para continuar.');
      response.locals.session = session;
      response.locals.userId = session.userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authenticatedSession(response: Response): ActiveSession {
  return response.locals.session as ActiveSession;
}

export function authRoutes(
  service: AuthService,
  google: GoogleService,
  env: ApiEnv,
): Router {
  const router = Router();
  const write = requireOrigin(env.WEB_ORIGIN);
  const secure = requireSession(service, env);

  router.post('/register', write, async (request, response) => {
    const parsed = registerRequestSchema.safeParse(request.body);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Dados de cadastro inválidos.');
    const result = await service.register(
      parsed.data,
      request.ip ?? 'unknown',
      readCookie(request, sessionCookieName(env)),
    );
    setSessionCookie(response, env, result.token);
    response.status(201).json({ user: result.user });
  });

  router.post('/login', write, async (request, response) => {
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Dados de entrada inválidos.');
    const result = await service.login(
      parsed.data,
      request.ip ?? 'unknown',
      readCookie(request, sessionCookieName(env)),
    );
    setSessionCookie(response, env, result.token);
    response.json({ user: result.user });
  });

  router.get('/me', secure, async (_request, response) => {
    response.json({
      user: await service.publicUser(authenticatedSession(response).userId),
    });
  });

  router.post('/logout', write, secure, async (request, response) => {
    const token = readCookie(request, sessionCookieName(env));
    if (token) await service.sessions.revoke(token);
    clearSessionCookie(response, env);
    response.status(204).end();
  });

  const oauthCookieName =
    env.NODE_ENV === 'production' ? '__Host-edutrack_oauth' : 'edutrack_oauth';
  const oauthCookie = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60 * 1000,
  };

  router.get('/google/start', async (request, response) => {
    try {
      const started = await google.start(
        'login',
        allowedReturnTo(request.query.returnTo),
      );
      response.cookie(oauthCookieName, started.browserSecret, oauthCookie);
      response.redirect(302, started.url);
    } catch {
      response.redirect(302, `${env.WEB_ORIGIN}/acesso?google=failed`);
    }
  });

  router.post(
    '/google/link/start',
    write,
    secure,
    async (request, response) => {
      try {
        const started = await google.start(
          'link',
          '/conta',
          authenticatedSession(response),
        );
        response.cookie(oauthCookieName, started.browserSecret, oauthCookie);
        response.json({ url: started.url });
      } catch {
        throw new HttpError(
          503,
          'GOOGLE_FAILED',
          'Não foi possível iniciar o Google. Tente novamente.',
        );
      }
    },
  );

  router.get('/google/callback', async (request, response) => {
    const currentUrl = new URL(request.originalUrl, env.API_PUBLIC_ORIGIN);
    const result = await google.callback(
      currentUrl,
      readCookie(request, oauthCookieName),
      readCookie(request, sessionCookieName(env)),
    );
    response.clearCookie(oauthCookieName, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    if (result.kind === 'login') {
      setSessionCookie(response, env, result.token);
      response.redirect(302, `${env.WEB_ORIGIN}${result.returnTo}`);
    } else if (result.kind === 'linked') {
      response.redirect(302, `${env.WEB_ORIGIN}/conta?google=linked`);
    } else {
      const path = result.intent === 'link' ? '/conta' : '/acesso';
      response.redirect(302, `${env.WEB_ORIGIN}${path}?google=${result.kind}`);
    }
  });

  return router;
}
