import { randomUUID } from 'node:crypto';
import type {
  CreateTask,
  TaskFilters,
  UpdateTask,
} from '@study-platform/contracts';
import type { DataSource } from 'typeorm';
import { taskEntity } from './task.entity.js';
import type { TaskEntity } from './task.entity.js';

export class TasksRepository {
  constructor(private readonly source: DataSource) {}
  private get rows() {
    return this.source.getRepository(taskEntity);
  }
  async create(userId: string, input: CreateTask) {
    const id = randomUUID();
    await this.rows.insert({ id, userId, ...input });
    return this.find(userId, id);
  }
  find(userId: string, id: string) {
    return this.rows.findOneBy({ id, userId });
  }
  async list(userId: string, filters: TaskFilters) {
    const query = this.rows
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId });
    if (filters.status)
      query.andWhere('task.status = :status', { status: filters.status });
    if (filters.priority)
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    if (filters.dueFrom)
      query.andWhere('task.dueDate >= :dueFrom', { dueFrom: filters.dueFrom });
    if (filters.dueTo)
      query.andWhere('task.dueDate <= :dueTo', { dueTo: filters.dueTo });
    return query
      .orderBy('task.createdAt', 'DESC')
      .addOrderBy('task.id', 'DESC')
      .skip((filters.page - 1) * filters.pageSize)
      .take(filters.pageSize)
      .getManyAndCount();
  }
  async update(userId: string, id: string, input: UpdateTask) {
    const fields = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Partial<TaskEntity>;
    const result = await this.rows.update({ id, userId }, fields);
    return result.affected ? this.find(userId, id) : null;
  }
  async delete(userId: string, id: string) {
    return (await this.rows.delete({ id, userId })).affected === 1;
  }
}
