import { webOrigins } from '../../config/origins.js';
import { Router } from 'express';
import { deckSchema } from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import type { AuthService } from '../auth/auth.service.js';
import {
  requireSession,
  requireOrigin,
  authenticatedSession,
} from '../auth/auth.routes.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { FlashcardAIService } from './flashcard-ai.service.js';
import { HttpError } from '../../shared/http-error.js';
export function flashcardAIRoutes(
  auth: AuthService,
  service: FlashcardAIService,
  prefs: PreferencesService,
  env: ApiEnv,
) {
  const router = Router();
  // Guard only these routes so ordinary flashcards never require AI.
  for (const suffix of ['/ai-generations', '/ai-generations/confirm']) {
    router.post(
      `/:deckId${suffix}`,
      requireSession(auth, env),
      requireOrigin(webOrigins(env)),
      prefs.guard('flashcards', true),
      async (req, res) => {
        res.setHeader('Cache-Control', 'private, no-store');
        const id = deckSchema.shape.id.safeParse(req.params.deckId);
        if (!id.success)
          throw new HttpError(
            404,
            'FLASHCARD_NOT_FOUND',
            'Baralho não encontrado.',
          );
        const owner = authenticatedSession(res).userId;
        res.json(
          suffix.endsWith('/confirm')
            ? await service.confirm(owner, id.data, req.body)
            : await service.generate(owner, id.data, req.body),
        );
      },
    );
  }
  return router;
}
