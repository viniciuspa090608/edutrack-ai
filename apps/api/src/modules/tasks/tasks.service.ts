import {
  createTaskSchema,
  taskFiltersSchema,
  taskListSchema,
  taskSchema,
  updateTaskSchema,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import type { TaskEntity } from './task.entity.js';
import { TasksRepository } from './tasks.repository.js';

function dto(row: TaskEntity | null) {
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
    status,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
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
    return dto(await this.repository.update(userId, id, parsed.data));
  }
  async delete(userId: string, id: string) {
    if (!(await this.repository.delete(userId, id)))
      throw new HttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada.');
  }
}
