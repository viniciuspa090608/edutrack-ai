import { webOrigins } from '../../config/origins.js';
import { Router } from 'express';
import type { Response } from 'express';
import { deckSchema } from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import type { AuthService } from '../auth/auth.service.js';
import {
  requireSession,
  requireOrigin,
  authenticatedSession,
} from '../auth/auth.routes.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import { HttpError } from '../../shared/http-error.js';
import type { ReviewsService } from './reviews.service.js';
export function reviewsRoutes(
  auth: AuthService,
  service: ReviewsService,
  prefs: PreferencesService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env), prefs.guard('flashcards'));
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });
  const owner = (res: Response) => authenticatedSession(res).userId;
  const id = (value: unknown) => {
    const result = deckSchema.shape.id.safeParse(value);
    if (!result.success)
      throw new HttpError(
        404,
        'REVIEW_NOT_FOUND',
        'Cartão ou baralho não encontrado.',
      );
    return result.data;
  };
  router.get('/reviews/pending', async (req, res) => {
    res.json(await service.pending(owner(res), req.query));
  });
  router.get('/:deckId/cards/:cardId/review', async (req, res) => {
    res.json(
      await service.detail(
        owner(res),
        id(req.params.deckId),
        id(req.params.cardId),
      ),
    );
  });
  router.get('/:deckId/cards/:cardId/review-state', async (req, res) => {
    res.json(
      await service.state(
        owner(res),
        id(req.params.deckId),
        id(req.params.cardId),
      ),
    );
  });
  router.get('/:deckId/cards/:cardId/reviews', async (req, res) => {
    res.json(
      await service.history(
        owner(res),
        id(req.params.deckId),
        id(req.params.cardId),
        req.query,
      ),
    );
  });
  router.post(
    '/:deckId/cards/:cardId/reviews',
    requireOrigin(webOrigins(env)),
    async (req, res) => {
      res.json(
        await service.rate(
          owner(res),
          id(req.params.deckId),
          id(req.params.cardId),
          req.body,
        ),
      );
    },
  );
  return router;
}
