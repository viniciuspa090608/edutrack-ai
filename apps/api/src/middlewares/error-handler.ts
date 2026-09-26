import { errorResponseSchema } from '@study-platform/contracts';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../shared/http-error.js';
import type { AppLogger } from '../shared/logger.js';

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'Rota não encontrada.'));
};

function isMalformedJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError && 'status' in error && error.status === 400
  );
}

export function errorHandler(logger: AppLogger): ErrorRequestHandler {
  return (error: unknown, _request, response, _next) => {
    void _next;
    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Erro interno do servidor.';

    if (error instanceof HttpError) {
      status = error.status;
      code = error.code;
      message = error.message;
      if (code === 'PREFERENCES_MISSING')
        logger.error({
          event: 'preferences.missing',
          requestId: response.locals.requestId,
        });
      if (error.retryAfter !== undefined)
        response.setHeader('Retry-After', String(error.retryAfter));
    } else if (isMalformedJson(error)) {
      status = 400;
      code = 'INVALID_JSON';
      message = 'JSON inválido.';
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      error.type === 'entity.too.large'
    ) {
      status = 413;
      code = 'PAYLOAD_TOO_LARGE';
      message = 'O arquivo excede o tamanho permitido.';
    } else {
      logger.error({
        event: 'http.error',
        requestId: response.locals.requestId,
        errorType: error instanceof Error ? error.name : typeof error,
      });
    }

    response
      .status(status)
      .json(errorResponseSchema.parse({ error: { code, message } }));
  };
}
