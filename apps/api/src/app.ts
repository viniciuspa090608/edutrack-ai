import cors from 'cors';
import express from 'express';
import type { CustomFetch } from 'openid-client';
import type { DataSource } from 'typeorm';
import type { ApiEnv } from './config/env.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';
import { requestContext } from './middlewares/request-context.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { AnalyticsService } from './modules/analytics/analytics.service.js';
import { analyticsRoutes } from './modules/analytics/analytics.routes.js';
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
import { PomodoroRepository } from './modules/pomodoro/pomodoro.repository.js';
import type { PomodoroClock } from './modules/pomodoro/pomodoro.repository.js';
import { PomodoroService } from './modules/pomodoro/pomodoro.service.js';
import { pomodoroRoutes } from './modules/pomodoro/pomodoro.routes.js';
import { routinesRoutes } from './modules/routines/routines.routes.js';
import { RoutinesService } from './modules/routines/routines.service.js';
import { RoutinesRepository } from './modules/routines/routines.repository.js';

import { SubjectsRepository } from './modules/subjects/subjects.repository.js';
import { SubjectsService } from './modules/subjects/subjects.service.js';
import { subjectsRoutes } from './modules/subjects/subjects.routes.js';
import { FlashcardsRepository } from './modules/flashcards/flashcards.repository.js';
import { FlashcardsService } from './modules/flashcards/flashcards.service.js';
import { flashcardsRoutes } from './modules/flashcards/flashcards.routes.js';
import { ImportRepository } from './modules/flashcards/import.repository.js';
import { ImportService } from './modules/flashcards/import.service.js';
import { importRoutes } from './modules/flashcards/import.routes.js';
import { ReviewsRepository } from './modules/flashcards/reviews.repository.js';
import { ReviewsService } from './modules/flashcards/reviews.service.js';
import type { ReviewClock } from './modules/flashcards/reviews.service.js';
import { reviewsRoutes } from './modules/flashcards/reviews.routes.js';
import { roadmapAIRoutes } from './modules/ai/roadmap-ai.routes.js';
import { RoadmapAIService } from './modules/ai/roadmap-ai.service.js';
import { OpenAIRoadmapProvider } from './modules/ai/roadmap-provider.js';
import { OpenAIStructuredProvider } from './shared/openai-structured-provider.js';
import { FlashcardAIService } from './modules/ai/flashcard-ai.service.js';
import { FlashcardReceipt } from './modules/ai/flashcard-receipt.js';
import { flashcardAIRoutes } from './modules/ai/flashcard-ai.routes.js';
import { RoadmapReceipt } from './modules/ai/roadmap-receipt.js';
import { RevisionReceipt } from './modules/subjects/revision-receipt.js';
import { RoadmapRevisionsService } from './modules/subjects/roadmap-revisions.service.js';
import { roadmapRevisionRoutes } from './modules/subjects/roadmap-revisions.routes.js';

export interface AppOptions {
  logger: AppLogger;
  webOrigin: string;
  source?: DataSource;
  env?: ApiEnv;
  oidcFetch?: CustomFetch;
  pomodoroClock?: PomodoroClock;
  aiFetch?: typeof fetch;
  aiClock?: () => Date;
  reviewClock?: ReviewClock;
}

export function createApp({
  logger,
  webOrigin,
  source,
  env,
  oidcFetch,
  pomodoroClock,
  aiFetch,
  aiClock,
  reviewClock,
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
    const prefs = new PreferencesService(source);
    app.use(
      '/analytics',
      analyticsRoutes(service, new AnalyticsService(source, prefs), env),
    );
    const subjects = new SubjectsService(new SubjectsRepository(source), prefs);
    const flashcards = new FlashcardsService(
      new FlashcardsRepository(source),
      subjects,
      prefs,
    );
    app.use(
      '/flashcard-decks',
      flashcardAIRoutes(
        service,
        new FlashcardAIService(
          flashcards,
          prefs,
          new OpenAIStructuredProvider(env, aiFetch),
          new FlashcardReceipt(env.AI_RECEIPT_KEY, aiClock),
          aiClock,
        ),
        prefs,
        env,
      ),
    );
    app.use(
      '/flashcard-decks',
      reviewsRoutes(
        service,
        new ReviewsService(new ReviewsRepository(source), prefs, reviewClock),
        prefs,
        env,
      ),
    );
    app.use(
      '/decks',
      importRoutes(
        service,
        new ImportService(new ImportRepository(source), prefs),
        prefs,
        env,
      ),
    );
    app.use(
      '/flashcard-decks',
      flashcardsRoutes(service, flashcards, prefs, env),
    );
    const roadmapAI = new RoadmapAIService(
      subjects,
      prefs,
      new OpenAIRoadmapProvider(env, aiFetch),
      new RoadmapReceipt(env.AI_RECEIPT_KEY, aiClock),
      aiClock,
    );
    app.use(
      '/subjects',
      roadmapRevisionRoutes(
        service,
        new RoadmapRevisionsService(
          subjects,
          prefs,
          roadmapAI,
          new RevisionReceipt(env.EMAIL_HMAC_KEY, aiClock),
        ),
        prefs,
        env,
      ),
    );
    app.use('/subjects', roadmapAIRoutes(service, roadmapAI, prefs, env));
    app.use('/subjects', subjectsRoutes(service, subjects, prefs, env));
    app.use(
      '/routines',
      routinesRoutes(
        service,
        new RoutinesService(new RoutinesRepository(source)),
        env,
      ),
    );
    app.use(
      '/pomodoro',
      pomodoroRoutes(
        service,
        new PomodoroService(
          new PomodoroRepository(source, pomodoroClock),
          new TasksService(new TasksRepository(source), subjects),
          prefs,
          subjects,
        ),
        env,
      ),
    );
    app.use(
      '/tasks',
      tasksRoutes(
        service,
        new TasksService(new TasksRepository(source), subjects),
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
