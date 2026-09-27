import { Router, raw } from 'express';
import type { Response } from 'express';
import {
  deckSchema,
  importUploadSchema,
  importMaxBytes,
} from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { AuthService } from '../auth/auth.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { ImportService } from './import.service.js';
export function importRoutes(
  auth: AuthService,
  service: ImportService,
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
  const id = (input: unknown) => {
    const result = deckSchema.shape.id.safeParse(input);
    if (!result.success)
      throw new HttpError(
        404,
        'IMPORT_NOT_FOUND',
        'Baralho ou tentativa não encontrado.',
      );
    return result.data;
  };
  const write = requireOrigin(env.WEB_ORIGIN);
  router.post(
    '/:deckId/imports',
    (req, _res, next) => {
      if (req.headers.origin !== env.WEB_ORIGIN)
        return next(
          new HttpError(403, 'ORIGIN_NOT_ALLOWED', 'Origem não permitida.'),
        );
      if (
        !req.is([
          'text/csv',
          'text/tab-separated-values',
          'application/octet-stream',
        ])
      )
        return next(
          new HttpError(
            415,
            'UNSUPPORTED_MEDIA_TYPE',
            'Envie um arquivo CSV ou TSV.',
          ),
        );
      next();
    },
    raw({
      type: [
        'text/csv',
        'text/tab-separated-values',
        'application/octet-stream',
      ],
      limit: importMaxBytes,
      inflate: false,
    }),
    async (req, res) => {
      const query = importUploadSchema.safeParse(req.query);
      if (!query.success || !Buffer.isBuffer(req.body))
        throw new HttpError(
          400,
          'INVALID_IMPORT_FILE',
          'Envie CSV ou TSV UTF-8 com o formato escolhido.',
        );
      res
        .status(201)
        .json(
          await service.upload(
            owner(res),
            id(req.params.deckId),
            query.data.format,
            req.body,
          ),
        );
    },
  );
  router.get('/:deckId/imports/:attemptId', async (req, res) => {
    res.json(
      await service.get(
        owner(res),
        id(req.params.deckId),
        id(req.params.attemptId),
      ),
    );
  });
  router.put('/:deckId/imports/:attemptId/preview', write, async (req, res) => {
    res.json(
      await service.preview(
        owner(res),
        id(req.params.deckId),
        id(req.params.attemptId),
        req.body,
      ),
    );
  });
  router.post(
    '/:deckId/imports/:attemptId/confirm',
    write,
    async (req, res) => {
      res.json(
        await service.confirm(
          owner(res),
          id(req.params.deckId),
          id(req.params.attemptId),
          req.body,
        ),
      );
    },
  );
  router.delete('/:deckId/imports/:attemptId', write, async (req, res) => {
    await service.cancel(
      owner(res),
      id(req.params.deckId),
      id(req.params.attemptId),
    );
    res.status(204).end();
  });
  return router;
}
