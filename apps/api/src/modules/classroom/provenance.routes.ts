import { Router } from 'express';
import { z } from 'zod';
import { classroomResolveConflictSchema } from '@study-platform/contracts';
import type { AuthService } from '../auth/auth.service.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { ApiEnv } from '../../config/env.js';
import { webOrigins } from '../../config/origins.js';
import { inputErrors } from '../../shared/input-errors.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
interface ProvenancePort {
  classroomSource(userId: string, id: string): Promise<unknown>;
  resolveClassroom(
    userId: string,
    id: string,
    revision: number,
    choice: 'keep_local' | 'accept_remote',
  ): Promise<void>;
}
export function provenanceRoutes(
  auth: AuthService,
  service: ProvenancePort,
  prefs: PreferencesService,
  module: 'tasks' | 'subjects',
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env), prefs.guard(module));
  router.get('/:id/classroom-source', async (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(
      await service.classroomSource(
        authenticatedSession(res).userId,
        z.uuid().parse(req.params.id),
      ),
    );
  });
  router.post(
    '/classroom-conflicts/:id',
    requireOrigin(webOrigins(env)),
    async (req, res) => {
      const input = classroomResolveConflictSchema.parse(req.body);
      await service.resolveClassroom(
        authenticatedSession(res).userId,
        z.uuid().parse(req.params.id),
        input.revision,
        input.choice,
      );
      res.status(204).end();
    },
  );
  router.use(inputErrors);
  return router;
}
