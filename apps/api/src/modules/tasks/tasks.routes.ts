import { webOrigins } from '../../config/origins.js';
import { taskSchema } from '@study-platform/contracts';
import { Router } from 'express';
import type { Response } from 'express';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import {
  authenticatedSession,
  requireOrigin,
  requireSession,
} from '../auth/auth.routes.js';
import type { AuthService } from '../auth/auth.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import type { TasksService } from './tasks.service.js';

export function tasksRoutes(
  auth: AuthService,
  service: TasksService,
  prefs: PreferencesService,
  env: ApiEnv,
) {
  const router = Router();
  router.use(requireSession(auth, env), prefs.guard('tasks'));
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });
  const owner = (res: Response) => authenticatedSession(res).userId;
  const id = (value: unknown) => {
    const parsed = taskSchema.shape.id.safeParse(value);
    if (!parsed.success)
      throw new HttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada.');
    return parsed.data;
  };
  const write = requireOrigin(webOrigins(env));
  router.get('/:taskId/subtasks', async (req, res) => {
    res.json(await service.listSubtasks(owner(res), id(req.params.taskId)));
  });
  router.post('/:taskId/subtasks', write, async (req, res) => {
    res
      .status(201)
      .json(
        await service.createSubtask(
          owner(res),
          id(req.params.taskId),
          req.body,
        ),
      );
  });
  router.put('/:taskId/subtasks/order', write, async (req, res) => {
    res.json(
      await service.reorderSubtasks(
        owner(res),
        id(req.params.taskId),
        req.body,
      ),
    );
  });
  router.patch('/:taskId/subtasks/:subtaskId', write, async (req, res) => {
    res.json(
      await service.updateSubtask(
        owner(res),
        id(req.params.taskId),
        id(req.params.subtaskId),
        req.body,
      ),
    );
  });
  router.delete('/:taskId/subtasks/:subtaskId', write, async (req, res) => {
    res.json(
      await service.deleteSubtask(
        owner(res),
        id(req.params.taskId),
        id(req.params.subtaskId),
      ),
    );
  });
  router.post('/:taskId/complete-subtasks', write, async (req, res) => {
    res.json(
      await service.completeSubtasks(
        owner(res),
        id(req.params.taskId),
        req.body,
      ),
    );
  });
  router.post('/', write, async (req, res) => {
    res.status(201).json(await service.create(owner(res), req.body));
  });
  router.get('/', async (req, res) => {
    res.json(await service.list(owner(res), req.query));
  });
  router.get('/:id', async (req, res) => {
    res.json(await service.detail(owner(res), id(req.params.id)));
  });
  router.patch('/:id', write, async (req, res) => {
    res.json(await service.update(owner(res), id(req.params.id), req.body));
  });
  router.delete('/:id', write, async (req, res) => {
    await service.delete(owner(res), id(req.params.id));
    res.status(204).end();
  });
  return router;
}
