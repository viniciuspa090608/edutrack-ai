import type { ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from './http-error.js';
export const inputErrors: ErrorRequestHandler = (
  error: unknown,
  _req,
  _res,
  next,
) => {
  next(
    error instanceof z.ZodError
      ? new HttpError(
          400,
          'INVALID_INPUT',
          'Dados inválidos. Revise os campos e tente novamente.',
        )
      : error,
  );
};
