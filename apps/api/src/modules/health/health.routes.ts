import { healthResponseSchema } from '@study-platform/contracts';
import { Router } from 'express';
import { HttpError } from '../../shared/http-error.js';

export const healthRoutes = Router();

healthRoutes.get('/', (_request, response) => {
  response.json(healthResponseSchema.parse({ status: 'ok' }));
});

healthRoutes.all('/', () => {
  throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Método não permitido.');
});
