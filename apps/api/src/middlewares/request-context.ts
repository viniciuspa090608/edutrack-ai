import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { AppLogger } from '../shared/logger.js';

export function requestContext(logger: AppLogger): RequestHandler {
  return (request, response, next) => {
    const requestId = randomUUID();
    const started = performance.now();
    const path = request.originalUrl.split('?')[0];
    response.locals.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    response.on('finish', () => {
      logger.info({
        event: 'http.response',
        requestId,
        method: request.method,
        path,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - started),
      });
    });
    next();
  };
}
