import {
  createTaskSchema,
  taskFiltersSchema,
  taskListSchema,
  taskSchema,
  updateTaskSchema,
  createSubtaskSchema,
  updateSubtaskSchema,
  subtaskOrderSchema,
  completeSubtasksSchema,
  subtasksResponseSchema,
  subtaskSchema,
} from '@study-platform/contracts';
import type { EntityManager } from 'typeorm';
import { HttpError } from '../../shared/http-error.js';
import type { TaskRecord } from './tasks.repository.js';
import type { SubtaskEntity } from './subtask.entity.js';
import { TasksRepository } from './tasks.repository.js';

function derivedStatus(
  total: number,
  completed: number,
  manual: TaskRecord['status'],
) {
  return total === 0
    ? manual
    : completed === 0
      ? 'PENDING'
      : completed === total
        ? 'COMPLETED'
        : 'IN_PROGRESS';
}
function dto(row: TaskRecord | null) {
  if (!row)
    throw new HttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada.');
  const {
    id,
    title,
    description,
    priority,
    dueDate,
    status,
    createdAt,
    updatedAt,
  } = row;
  return taskSchema.parse({
    id,
    title,
    description,
    priority,
    dueDate,
    status: derivedStatus(row.subtaskTotal, row.subtaskCompleted, status),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    subtaskTotal: row.subtaskTotal,
    subtaskCompleted: row.subtaskCompleted,
    progressPercent: row.subtaskTotal
      ? (row.subtaskCompleted / row.subtaskTotal) * 100
      : null,
  });
}
export class TasksService {
  constructor(private readonly repository: TasksRepository) {}
  async create(userId: string, input: unknown) {
    const parsed = createTaskSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Dados de tarefa inválidos.');
    return dto(await this.repository.create(userId, parsed.data));
  }
  async detail(userId: string, id: string) {
    return dto(await this.repository.find(userId, id));
  }
  async list(userId: string, input: unknown) {
    const parsed = taskFiltersSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Filtros inválidos.');
    const [items, total] = await this.repository.list(userId, parsed.data);
    return taskListSchema.parse({
      items: items.map(dto),
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      total,
      totalPages: Math.ceil(total / parsed.data.pageSize),
    });
  }
  async update(userId: string, id: string, input: unknown) {
    const parsed = updateTaskSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(400, 'INVALID_INPUT', 'Dados de tarefa inválidos.');
    return this.repository.locked(userId, id, async (manager, task) => {
      const subtasks = await this.repository.subtasks(manager, userId, id);
      if (subtasks.length && parsed.data.status) {
        if (parsed.data.status !== 'COMPLETED')
          throw new HttpError(
            409,
            'TASK_STATUS_DERIVED',
            'O status é calculado pelas subtarefas.',
          );
        if (subtasks.some((subtask) => !subtask.isCompleted))
          throw new HttpError(
            409,
            'SUBTASK_CONFIRMATION_REQUIRED',
            'Confirme a conclusão das subtarefas pendentes.',
          );
      }
      const changes = Object.fromEntries(
        Object.entries(parsed.data).filter(
          ([key, value]) =>
            value !== undefined && value !== task[key as keyof typeof task],
        ),
      );
      if (Object.keys(changes).length)
        await this.repository.updateFields(manager, userId, id, changes);
      return dto(await this.repository.readTask(manager, userId, id));
    });
  }
  async delete(userId: string, id: string) {
    if (!(await this.repository.delete(userId, id)))
      throw new HttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada.');
  }
  private async response(
    manager: EntityManager,
    userId: string,
    taskId: string,
  ) {
    const rows = await this.repository.subtasks(manager, userId, taskId);
    return subtasksResponseSchema.parse({
      items: rows.map((row) =>
        subtaskSchema.parse({
          ...row,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        }),
      ),
      task: dto(await this.repository.readTask(manager, userId, taskId)),
    });
  }
  listSubtasks(userId: string, taskId: string) {
    return this.repository.snapshot(userId, taskId, (manager) =>
      this.response(manager, userId, taskId),
    );
  }
  private mutateSubtasks(
    userId: string,
    taskId: string,
    work: (manager: EntityManager, items: SubtaskEntity[]) => Promise<void>,
  ) {
    return this.repository.locked(userId, taskId, async (manager, task) => {
      await work(
        manager,
        await this.repository.subtasks(manager, userId, taskId),
      );
      const items = await this.repository.subtasks(manager, userId, taskId);
      const status = derivedStatus(
        items.length,
        items.filter((item) => item.isCompleted).length,
        task.status,
      );
      if (status !== task.status)
        await this.repository.updateFields(manager, userId, taskId, { status });
      return this.response(manager, userId, taskId);
    });
  }
  async createSubtask(userId: string, taskId: string, input: unknown) {
    const parsed = createSubtaskSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Título de subtarefa inválido.',
      );
    return this.mutateSubtasks(userId, taskId, async (manager, items) => {
      await this.repository.insertSubtask(
        manager,
        userId,
        taskId,
        parsed.data.title,
        items.length,
      );
    });
  }
  async updateSubtask(
    userId: string,
    taskId: string,
    id: string,
    input: unknown,
  ) {
    const parsed = updateSubtaskSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Dados de subtarefa inválidos.',
      );
    return this.mutateSubtasks(userId, taskId, async (manager, items) => {
      const item = items.find((item) => item.id === id);
      if (!item)
        throw new HttpError(
          404,
          'SUBTASK_NOT_FOUND',
          'Subtarefa não encontrada.',
        );
      const changes = Object.fromEntries(
        Object.entries(parsed.data).filter(
          ([key, value]) =>
            value !== undefined && value !== item[key as keyof typeof item],
        ),
      );
      await this.repository.updateSubtask(manager, userId, taskId, id, changes);
    });
  }
  async deleteSubtask(userId: string, taskId: string, id: string) {
    return this.mutateSubtasks(userId, taskId, async (manager, items) => {
      if (!items.some((item) => item.id === id))
        throw new HttpError(
          404,
          'SUBTASK_NOT_FOUND',
          'Subtarefa não encontrada.',
        );
      await this.repository.removeSubtask(manager, userId, taskId, id);
      for (const [position, item] of items
        .filter((item) => item.id !== id)
        .entries())
        if (item.position !== position)
          await this.repository.updateSubtask(
            manager,
            userId,
            taskId,
            item.id,
            { position },
          );
    });
  }
  async reorderSubtasks(userId: string, taskId: string, input: unknown) {
    const parsed = subtaskOrderSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Ordem de subtarefas inválida.',
      );
    return this.mutateSubtasks(userId, taskId, async (manager, items) => {
      if (parsed.data.ids.some((id) => !items.some((item) => item.id === id)))
        throw new HttpError(
          404,
          'SUBTASK_NOT_FOUND',
          'Subtarefa não encontrada.',
        );
      if (parsed.data.ids.length !== items.length)
        throw new HttpError(
          400,
          'INVALID_INPUT',
          'Envie a lista completa de subtarefas.',
        );
      for (const [position, id] of parsed.data.ids.entries())
        if (items.find((item) => item.id === id)!.position !== position)
          await this.repository.updateSubtask(manager, userId, taskId, id, {
            position,
          });
    });
  }
  async completeSubtasks(userId: string, taskId: string, input: unknown) {
    if (!completeSubtasksSchema.safeParse(input).success)
      throw new HttpError(
        409,
        'SUBTASK_CONFIRMATION_REQUIRED',
        'Confirme a conclusão das subtarefas pendentes.',
      );
    return this.mutateSubtasks(userId, taskId, async (manager) => {
      await this.repository.completeSubtasks(manager, userId, taskId);
    });
  }
}
