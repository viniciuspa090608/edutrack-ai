import {
  startPomodoroSchema,
  pomodoroCommandSchema,
  pomodoroSessionSchema,
  pomodoroPageSchema,
  pomodoroHistorySchema,
  pomodoroSummarySchema,
} from '@study-platform/contracts';
import type {
  PomodoroAction,
  PomodoroSession,
} from '@study-platform/contracts';
import type { EntityManager } from 'typeorm';
import { HttpError } from '../../shared/http-error.js';
import type { TasksService } from '../tasks/tasks.service.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import { PomodoroRepository } from './pomodoro.repository.js';
import type { SessionRecord } from './pomodoro.repository.js';

import type { SubjectsService } from '../subjects/subjects.service.js';
import { publishActivity } from '../analytics/activity-publisher.js';
import { randomUUID } from 'node:crypto';
const BLOCK = 1_500_000;
export class PomodoroConflict extends Error {
  constructor(public readonly session: PomodoroSession) {
    super('A sessão mudou. Confira o estado atual.');
  }
}
function effective(row: SessionRecord, now: Date): SessionRecord {
  const result = { ...row, active_ms: Number(row.active_ms) };
  if (result.state === 'RUNNING' && result.running_since) {
    const boundary = (result.completed_blocks + 1) * BLOCK;
    result.active_ms = Math.min(
      boundary,
      result.active_ms +
        Math.max(0, now.getTime() - result.running_since.getTime()),
    );
    if (result.active_ms === boundary) {
      result.completed_blocks += 1;
      result.state = 'BETWEEN_BLOCKS';
      result.running_since = null;
    }
  }
  return result;
}
function dto(row: SessionRecord, now: Date) {
  const value = effective(row, now);
  return pomodoroSessionSchema.parse({
    id: value.id,
    taskId: value.task_id,
    subjectId: value.subject_id,
    state: value.state,
    activeSeconds: Math.floor(value.active_ms / 1000),
    completedBlocks: value.completed_blocks,
    remainingSeconds:
      value.state === 'BETWEEN_BLOCKS' || value.ended_at
        ? 0
        : Math.ceil(
            ((value.completed_blocks + 1) * BLOCK - value.active_ms) / 1000,
          ),
    version: value.version,
    startedAt: value.started_at.toISOString(),
    endedAt: value.ended_at?.toISOString() ?? null,
    serverTime: now.toISOString(),
  });
}
export class PomodoroService {
  constructor(
    private readonly repository: PomodoroRepository,
    private readonly tasks: Pick<TasksService, 'detail'>,
    private readonly prefs: Pick<PreferencesService, 'requireEnabled'>,
    private readonly subjects: Pick<SubjectsService, 'requireOwned'>,
  ) {}
  async start(userId: string, input: unknown) {
    const parsed = startPomodoroSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Dados de sessão inválidos.');
    if (parsed.data.subjectId)
      await this.subjects.requireOwned(userId, parsed.data.subjectId);
    if (parsed.data.taskId) {
      await this.prefs.requireEnabled(userId, 'tasks');
      const task = await this.tasks.detail(userId, parsed.data.taskId);
      if (
        parsed.data.subjectId &&
        task.subjectId &&
        parsed.data.subjectId !== task.subjectId
      )
        throw new HttpError(
          400,
          'SUBJECT_MISMATCH',
          'Escolha a matéria vinculada à tarefa.',
        );
    }
    try {
      return await this.repository.transaction(async (manager) => {
        await this.repository.lockOwner(manager, userId);
        const current = await this.repository.current(manager, userId);
        const now = await this.repository.now(manager);
        if (current) throw new PomodoroConflict(dto(current, now));
        return dto(
          await this.repository.create(
            manager,
            userId,
            parsed.data.taskId ?? null,
            parsed.data.subjectId ?? null,
            now,
          ),
          now,
        );
      });
    } catch (error) {
      const driver =
        error && typeof error === 'object' && 'driverError' in error
          ? error.driverError
          : error;
      if (
        driver &&
        typeof driver === 'object' &&
        'code' in driver &&
        driver.code === 'ER_NO_REFERENCED_ROW_2'
      )
        throw new HttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada.');
      throw error;
    }
  }
  private async record(
    manager: EntityManager,
    userId: string,
    id: string,
    lock = false,
  ) {
    const row = await this.repository.find(manager, userId, id, lock);
    if (!row)
      throw new HttpError(404, 'POMODORO_NOT_FOUND', 'Sessão não encontrada.');
    return row;
  }
  current(userId: string) {
    return this.repository.transaction(async (manager) => {
      const row = await this.repository.current(manager, userId);
      const now = await this.repository.now(manager);
      return { session: row ? dto(row, now) : null };
    });
  }
  detail(userId: string, id: string) {
    return this.repository.transaction(async (manager) =>
      dto(
        await this.record(manager, userId, id),
        await this.repository.now(manager),
      ),
    );
  }
  async history(userId: string, input: unknown) {
    const parsed = pomodoroPageSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Paginação inválida.');
    if (parsed.data.subjectId)
      await this.subjects.requireOwned(userId, parsed.data.subjectId);
    return this.repository.transaction(async (manager) => {
      const { page, pageSize } = parsed.data;
      const { items, total } = await this.repository.history(
        manager,
        userId,
        page,
        pageSize,
        parsed.data.subjectId,
      );
      const now = await this.repository.now(manager);
      return pomodoroHistorySchema.parse({
        items: items.map((row) => dto(row, now)),
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      });
    });
  }
  summary(userId: string) {
    return this.repository.transaction(async (manager) =>
      pomodoroSummarySchema.parse(
        await this.repository.summary(manager, userId),
      ),
    );
  }
  transition(
    userId: string,
    id: string,
    action: PomodoroAction,
    input: unknown,
  ) {
    const parsed = pomodoroCommandSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Comando inválido.');
    return this.repository.transaction(async (manager) => {
      await this.repository.lockOwner(manager, userId);
      const stored = await this.record(manager, userId, id, true);
      const now = await this.repository.now(manager);
      const row = effective(stored, now);
      if (
        (action === 'cancel' && row.state === 'CANCELED') ||
        (action === 'complete' && row.state === 'COMPLETED')
      )
        return dto(row, now);
      if (stored.version !== parsed.data.version || row.ended_at)
        throw new PomodoroConflict(dto(row, now));
      if (action === 'pause' && row.state === 'RUNNING') {
        row.state = 'PAUSED';
        row.running_since = null;
      } else if (
        (action === 'resume' && row.state === 'PAUSED') ||
        (action === 'next-block' && row.state === 'BETWEEN_BLOCKS')
      ) {
        row.state = 'RUNNING';
        row.running_since = now;
      } else if (
        action === 'cancel' ||
        (action === 'complete' && row.completed_blocks > 0)
      ) {
        row.state = action === 'cancel' ? 'CANCELED' : 'COMPLETED';
        row.ended_at = now;
        row.running_since = null;
      } else throw new PomodoroConflict(dto(row, now));
      row.version += 1;
      const elapsed = row.active_ms - Number(stored.active_ms);
      if (stored.running_since && elapsed > 0)
        await manager.query(
          'INSERT INTO pomodoro_active_intervals (id,user_id,session_id,started_at,ended_at,source_version) VALUES (?,?,?,?,?,?)',
          [
            randomUUID(),
            userId,
            id,
            stored.running_since,
            new Date(stored.running_since.getTime() + elapsed),
            stored.version,
          ],
        );
      await this.repository.save(manager, row);
      if (
        row.completed_blocks > stored.completed_blocks &&
        stored.running_since
      ) {
        const boundaryAt = new Date(stored.running_since.getTime() + elapsed);
        await publishActivity(
          manager,
          userId,
          'POMODORO_BLOCK_COMPLETED',
          'pomodoro-block',
          id,
          String(row.completed_blocks),
          boundaryAt,
        );
      }
      if (row.state === 'COMPLETED')
        await publishActivity(
          manager,
          userId,
          'POMODORO_SESSION_COMPLETED',
          'pomodoro',
          id,
          'terminal',
          now,
        );
      return dto(row, now);
    });
  }
}
