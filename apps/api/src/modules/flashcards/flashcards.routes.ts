import { webOrigins } from '../../config/origins.js';
import { Router } from 'express';
import type { Response } from 'express';
import { deckSchema } from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { AuthService } from '../auth/auth.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { FlashcardsService } from './flashcards.service.js';
export function flashcardsRoutes(
  auth: AuthService,
  service: FlashcardsService,
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
        'FLASHCARD_NOT_FOUND',
        'Baralho ou cartão não encontrado.',
      );
    return result.data;
  };
  const write = requireOrigin(webOrigins(env));
  router.get('/', async (req, res) => {
    res.json(await service.list(owner(res), req.query));
  });
  router.post('/', write, async (req, res) => {
    res.status(201).json(await service.create(owner(res), req.body));
  });
  router.get('/:deckId', async (req, res) => {
    res.json(await service.detail(owner(res), id(req.params.deckId)));
  });
  router.patch('/:deckId', write, async (req, res) => {
    res.json(await service.update(owner(res), id(req.params.deckId), req.body));
  });
  router.delete('/:deckId', write, async (req, res) => {
    await service.delete(owner(res), id(req.params.deckId));
    res.status(204).end();
  });
  router.get('/:deckId/cards', async (req, res) => {
    res.json(
      await service.listCards(owner(res), id(req.params.deckId), req.query),
    );
  });
  router.post('/:deckId/cards', write, async (req, res) => {
    res
      .status(201)
      .json(
        await service.createCard(owner(res), id(req.params.deckId), req.body),
      );
  });
  router.get('/:deckId/cards/:cardId', async (req, res) => {
    res.json(
      await service.cardDetail(
        owner(res),
        id(req.params.deckId),
        id(req.params.cardId),
      ),
    );
  });
  router.patch('/:deckId/cards/:cardId', write, async (req, res) => {
    res.json(
      await service.updateCard(
        owner(res),
        id(req.params.deckId),
        id(req.params.cardId),
        req.body,
      ),
    );
  });
  router.delete('/:deckId/cards/:cardId', write, async (req, res) => {
    await service.deleteCard(
      owner(res),
      id(req.params.deckId),
      id(req.params.cardId),
    );
    res.status(204).end();
  });
  return router;
}
