import {
  loginRequestSchema,
  registerRequestSchema,
  emailCodeSchema,
  recoveryRequestSchema,
  recoveryVerifySchema,
  passwordResetSchema,
} from '@study-platform/contracts';
import { Router } from 'express';
import type { Request, RequestHandler, Response } from 'express';
import type { ApiEnv } from '../../config/env.js';
import { webOrigins } from '../../config/origins.js';
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

function shortCookie(
  response: Response,
  env: ApiEnv,
  name: string,
  token: string,
  minutes: number,
): void {
  response.cookie(
    env.NODE_ENV === 'production' ? `__Host-${name}` : name,
    token,
    {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: minutes * 60_000,
    },
  );
}
function clearShortCookie(response: Response, env: ApiEnv, name: string): void {
  response.clearCookie(
    env.NODE_ENV === 'production' ? `__Host-${name}` : name,
    {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  );
}
function shortToken(
  request: Request,
  env: ApiEnv,
  name: string,
): string | undefined {
  return readCookie(
    request,
    env.NODE_ENV === 'production' ? `__Host-${name}` : name,
  );
}

export function requireOrigin(
  webOrigin: string | readonly string[],
): RequestHandler {
  return (request, _response, next) => {
    if (
      !request.headers.origin ||
      !(typeof webOrigin === 'string' ? [webOrigin] : webOrigin).includes(
        request.headers.origin,
      )
    ) {
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
      if (!(await service.users.isEmailVerified(session.userId)))
        throw new HttpError(
          403,
          'EMAIL_VERIFICATION_REQUIRED',
          'Confirme seu e-mail para continuar.',
        );
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
  const write = requireOrigin(webOrigins(env));
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
    clearSessionCookie(response, env);
    shortCookie(response, env, 'edutrack_verify', result.verificationToken, 15);
    response.status(201).json({ pendingVerification: true });
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
    if (result.kind === 'pending') {
      clearSessionCookie(response, env);
      shortCookie(
        response,
        env,
        'edutrack_verify',
        result.verificationToken,
        15,
      );
      response.json({ pendingVerification: true });
    } else {
      clearShortCookie(response, env, 'edutrack_verify');
      setSessionCookie(response, env, result.token);
      response.json({ user: result.user });
    }
  });

  router.post(
    '/email-verification/resend',
    write,
    async (request, response) => {
      const token = shortToken(request, env, 'edutrack_verify');
      await service.resendConfirmation(token, request.ip ?? 'unknown');
      response.status(202).json({
        message: 'Se o endereço estiver pendente, enviaremos um código.',
      });
    },
  );

  router.post(
    '/email-verification/confirm',
    write,
    async (request, response) => {
      await service.limitEmailValidation(
        'verify_email',
        request.ip ?? 'unknown',
      );
      const parsed = emailCodeSchema.safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(400, 'INVALID_INPUT', 'Código inválido.');
      const token = shortToken(request, env, 'edutrack_verify');
      await service.confirmEmail(token, parsed.data.code);
      clearShortCookie(response, env, 'edutrack_verify');
      response.status(204).end();
    },
  );

  const recoveryMessage =
    'Se houver uma conta com senha local, enviaremos um código. Você também pode entrar com Google ou recuperar o acesso à sua conta Google.';
  router.post(
    '/password-recovery/request',
    write,
    async (request, response) => {
      const parsed = recoveryRequestSchema.safeParse(request.body);
      if (!parsed.success)
        throw new HttpError(400, 'INVALID_INPUT', 'E-mail inválido.');
      await service.requestRecovery(parsed.data.email, request.ip ?? 'unknown');
      response.status(202).json({ message: recoveryMessage });
    },
  );

  router.post('/password-recovery/verify', write, async (request, response) => {
    await service.limitEmailValidation(
      'reset_password',
      request.ip ?? 'unknown',
    );
    const parsed = recoveryVerifySchema.safeParse(request.body);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Dados inválidos.');
    const grant = await service.verifyRecovery(
      parsed.data.email,
      parsed.data.code,
    );
    shortCookie(response, env, 'edutrack_reset', grant, 5);
    response.status(204).end();
  });

  router.post('/password-recovery/reset', write, async (request, response) => {
    const parsed = passwordResetSchema.safeParse(request.body);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Senha inválida.');
    const token = shortToken(request, env, 'edutrack_reset');
    await service.resetPassword(token, parsed.data.password);
    clearShortCookie(response, env, 'edutrack_reset');
    clearSessionCookie(response, env);
    response.status(204).end();
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

  router.post(
    '/google/reauth/start',
    write,
    secure,
    async (_request, response) => {
      try {
        const started = await google.start(
          'reauth',
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
    } else if (result.kind === 'reauthenticated') {
      response.redirect(302, `${env.WEB_ORIGIN}/conta?google=reauthenticated`);
    } else {
      const path = result.intent !== 'login' ? '/conta' : '/acesso';
      response.redirect(302, `${env.WEB_ORIGIN}${path}?google=${result.kind}`);
    }
  });

  return router;
}
