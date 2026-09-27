import { randomUUID } from 'node:crypto';
import type {
  CreateTask,
  TaskFilters,
  UpdateTask,
} from '@study-platform/contracts';
import type { DataSource, EntityManager } from 'typeorm';
import type { UpdateSubtask } from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { subtaskEntity } from './subtask.entity.js';
import { taskEntity } from './task.entity.js';
import { publishActivity } from '../analytics/activity-publisher.js';
import { lockStudyProgress } from '../study-progress/activity-recorder.js';
import type { TaskEntity } from './task.entity.js';

export type TaskRecord = TaskEntity & {
  subtaskTotal: number;
  subtaskCompleted: number;
};
export class TasksRepository {
  constructor(private readonly source: DataSource) {}
  async create(userId: string, input: CreateTask) {
    const id = randomUUID();
    await this.source.transaction(async (manager) => {
      await lockStudyProgress(manager, userId);
      await manager.getRepository(taskEntity).insert({ id, userId, ...input });
      if (input.status === 'COMPLETED')
        await publishActivity(
          manager,
          userId,
          'TASK_COMPLETED',
          'task',
          id,
          undefined,
          undefined,
          false,
        );
    });
    return this.find(userId, id);
  }
  find(userId: string, id: string) {
    return this.source.transaction((manager) =>
      this.readTask(manager, userId, id),
    );
  }
  async list(userId: string, filters: TaskFilters) {
    return this.source.transaction(async (manager) => {
      const query = manager
        .getRepository(taskEntity)
        .createQueryBuilder('task')
        .where('task.userId = :userId', { userId });
      if (filters.subjectId)
        query.andWhere('task.subjectId = :subjectId', {
          subjectId: filters.subjectId,
        });
      if (filters.status)
        query.andWhere('task.status = :status', { status: filters.status });
      if (filters.priority)
        query.andWhere('task.priority = :priority', {
          priority: filters.priority,
        });
      if (filters.dueFrom)
        query.andWhere('task.dueDate >= :dueFrom', {
          dueFrom: filters.dueFrom,
        });
      if (filters.dueTo)
        query.andWhere('task.dueDate <= :dueTo', { dueTo: filters.dueTo });
      const [rows, total] = await query
        .orderBy('task.createdAt', 'DESC')
        .addOrderBy('task.id', 'DESC')
        .skip((filters.page - 1) * filters.pageSize)
        .take(filters.pageSize)
        .getManyAndCount();
      return [await this.summarize(manager, userId, rows), total] as const;
    });
  }
  async updateFields(
    manager: EntityManager,
    userId: string,
    id: string,
    input: UpdateTask,
  ) {
    const fields = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Partial<TaskEntity>;
    await manager.getRepository(taskEntity).update({ id, userId }, fields);
  }
  async delete(userId: string, id: string) {
    return this.locked(
      userId,
      id,
      async (manager) =>
        (await manager.getRepository(taskEntity).delete({ id, userId }))
          .affected === 1,
    );
  }
  async summarize(
    manager: EntityManager,
    userId: string,
    rows: TaskEntity[],
  ): Promise<TaskRecord[]> {
    if (!rows.length) return [];
    const counts = await manager.query<
      Array<{
        taskId: string;
        total: number | string;
        completed: number | string;
      }>
    >(
      `SELECT s.task_id AS taskId, COUNT(*) AS total, SUM(s.is_completed) AS completed
       FROM task_subtasks s JOIN study_tasks t ON t.id = s.task_id
       WHERE t.user_id = ? AND t.id IN (${rows.map(() => '?').join(',')}) GROUP BY s.task_id`,
      [userId, ...rows.map((row) => row.id)],
    );
    const byId = new Map(counts.map((count) => [count.taskId, count]));
    return rows.map((row) => ({
      ...row,
      subtaskTotal: Number(byId.get(row.id)?.total ?? 0),
      subtaskCompleted: Number(byId.get(row.id)?.completed ?? 0),
    }));
  }
  async readTask(
    manager: EntityManager,
    userId: string,
    id: string,
  ): Promise<TaskRecord | null> {
    const row = await manager
      .getRepository(taskEntity)
      .findOneBy({ id, userId });
    return row ? (await this.summarize(manager, userId, [row]))[0]! : null;
  }
  private scopedTransaction<T>(
    userId: string,
    id: string,
    lock: boolean,
    work: (manager: EntityManager, task: TaskEntity) => Promise<T>,
  ) {
    return this.source.transaction(async (manager) => {
      const query = manager
        .getRepository(taskEntity)
        .createQueryBuilder('task')
        .where('task.id = :id AND task.userId = :userId', { id, userId });
      if (lock) await lockStudyProgress(manager, userId);
      if (lock) query.setLock('pessimistic_write');
      const task = await query.getOne();
      if (!task)
        throw new HttpError(404, 'TASK_NOT_FOUND', 'Tarefa não encontrada.');
      const result = await work(manager, task);
      if (lock) {
        const after = await manager
          .getRepository(taskEntity)
          .findOneBy({ id, userId });
        if (task.status !== 'COMPLETED' && after?.status === 'COMPLETED')
          await publishActivity(manager, userId, 'TASK_COMPLETED', 'task', id);
      }
      return result;
    });
  }
  locked<T>(
    userId: string,
    id: string,
    work: (manager: EntityManager, task: TaskEntity) => Promise<T>,
  ) {
    return this.scopedTransaction(userId, id, true, work);
  }
  snapshot<T>(
    userId: string,
    id: string,
    work: (manager: EntityManager, task: TaskEntity) => Promise<T>,
  ) {
    return this.scopedTransaction(userId, id, false, work);
  }
  subtasks(manager: EntityManager, userId: string, taskId: string) {
    return manager
      .getRepository(subtaskEntity)
      .createQueryBuilder('subtask')
      .innerJoin('study_tasks', 'task', 'task.id = subtask.taskId')
      .where('task.user_id = :userId AND subtask.taskId = :taskId', {
        userId,
        taskId,
      })
      .orderBy('subtask.position', 'ASC')
      .addOrderBy('subtask.id', 'ASC')
      .getMany();
  }
  async insertSubtask(
    manager: EntityManager,
    userId: string,
    taskId: string,
    title: string,
    position: number,
  ) {
    await manager.query(
      'INSERT INTO task_subtasks (id, task_id, title, position) SELECT ?, id, ?, ? FROM study_tasks WHERE id = ? AND user_id = ?',
      [randomUUID(), title, position, taskId, userId],
    );
  }
  async updateSubtask(
    manager: EntityManager,
    userId: string,
    taskId: string,
    id: string,
    input: UpdateSubtask & { position?: number },
  ) {
    const columns = {
      title: 'title',
      isCompleted: 'is_completed',
      position: 'position',
    } as const;
    const entries = Object.entries(input).filter(
      ([, value]) => value !== undefined,
    ) as Array<[keyof typeof columns, unknown]>;
    if (!entries.length) return;
    await manager.query(
      `UPDATE task_subtasks s JOIN study_tasks t ON t.id = s.task_id SET ${entries.map(([key]) => `s.${columns[key]} = ?`).join(', ')} WHERE t.user_id = ? AND s.task_id = ? AND s.id = ?`,
      [...entries.map(([, value]) => value), userId, taskId, id],
    );
  }
  async removeSubtask(
    manager: EntityManager,
    userId: string,
    taskId: string,
    id: string,
  ) {
    await manager.query(
      'DELETE s FROM task_subtasks s JOIN study_tasks t ON t.id = s.task_id WHERE t.user_id = ? AND s.task_id = ? AND s.id = ?',
      [userId, taskId, id],
    );
  }
  async completeSubtasks(
    manager: EntityManager,
    userId: string,
    taskId: string,
  ) {
    await manager.query(
      'UPDATE task_subtasks s JOIN study_tasks t ON t.id = s.task_id SET s.is_completed = true WHERE t.user_id = ? AND s.task_id = ? AND s.is_completed = false',
      [userId, taskId],
    );
  }
}
