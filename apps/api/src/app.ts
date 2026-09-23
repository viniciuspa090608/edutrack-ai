import cors from 'cors';
import express from 'express';
import { errorHandler, notFound } from './middlewares/error-handler.js';
import { requestContext } from './middlewares/request-context.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { HttpError } from './shared/http-error.js';
import type { AppLogger } from './shared/logger.js';

export interface AppOptions {
  logger: AppLogger;
  webOrigin: string;
}

export function createApp({ logger, webOrigin }: AppOptions) {
  const app = express();

  app.use(requestContext(logger));
  app.use(
    cors({
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
  app.use(notFound);
  app.use(errorHandler(logger));

  return app;
}
