import cors from 'cors';
import express from 'express';
import type { CustomFetch } from 'openid-client';
import type { DataSource } from 'typeorm';
import type { ApiEnv } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';
import { requestContext } from './middlewares/request-context.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { AuthRepository } from './modules/auth/auth.repository.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { AuthService } from './modules/auth/auth.service.js';
import { GoogleService } from './modules/auth/google.service.js';
import { OAuthRepository } from './modules/auth/oauth.repository.js';
import { RateLimitRepository } from './modules/auth/rate-limit.repository.js';
import { SessionRepository } from './modules/auth/session.repository.js';
import { EmailCrypto } from './modules/auth/email-crypto.js';
import { EmailRepository } from './modules/auth/email.repository.js';
import { HttpError } from './shared/http-error.js';
import type { AppLogger } from './shared/logger.js';
import { ProfileService } from './modules/auth/profile.service.js';
import { profileRoutes } from './modules/auth/profile.routes.js';
import { PreferencesService } from './modules/preferences/preferences.service.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { TasksService } from './modules/tasks/tasks.service.js';
import { TasksRepository } from './modules/tasks/tasks.repository.js';

export interface AppOptions {
  logger: AppLogger;
  webOrigin: string;
  source?: DataSource;
  env?: ApiEnv;
  oidcFetch?: CustomFetch;
}

export function createApp({
  logger,
  webOrigin,
  source,
  env,
  oidcFetch,
}: AppOptions) {
  const app = express();

  app.use(requestContext(logger));
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || origin === webOrigin) callback(null, true);
        else
          callback(
            new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origem não permitida.'),
          );
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use('/health', healthRoutes);
  if (source && env) {
    if (!env.EMAIL_HMAC_KEY || !env.EMAIL_ENCRYPTION_KEY)
      throw new Error('Email keys are not configured');
    const email = new EmailRepository(
      source,
      new EmailCrypto(env.EMAIL_HMAC_KEY, env.EMAIL_ENCRYPTION_KEY),
    );
    const service = new AuthService(
      new AuthRepository(source),
      new SessionRepository(source),
      new RateLimitRepository(source),
      email,
    );
    const google = new GoogleService(
      env,
      service.users,
      service.sessions,
      new OAuthRepository(source),
      oidcFetch,
    );
    app.use('/auth', authRoutes(service, google, env));
    app.use(
      '/tasks',
      tasksRoutes(
        service,
        new TasksService(new TasksRepository(source)),
        new PreferencesService(source),
        env,
      ),
    );
    app.use(
      '/profile',
      profileRoutes(
        service,
        new ProfileService(service),
        new PreferencesService(source),
        env,
      ),
    );
  }
  app.use(notFound);
  app.use(errorHandler(logger));

  return app;
}
