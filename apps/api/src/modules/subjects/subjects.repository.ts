import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import type {
  CreateSubject,
  UpdateSubject,
  SubjectPagination,
  StudySubject,
  UpdatePlanItem,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';

interface SubjectRecord {
  id: string;
  name: string;
  current_level: StudySubject['currentLevel'];
  objective: string;
  due_date: string;
  weekly_hours: string;
  created_at: Date;
  updated_at: Date;
}
interface ItemRecord {
  id: string;
  subject_id: string;
  title: string;
  status: StudySubject['planItems'][number]['status'];
  position: number;
  created_at: Date;
  updated_at: Date;
}
const missing = () =>
  new HttpError(404, 'SUBJECT_NOT_FOUND', 'Matéria não encontrada.');
export class SubjectsRepository {
  constructor(private readonly source: DataSource) {}
  private async owned(
    manager: EntityManager,
    userId: string,
    id: string,
    lock = false,
  ) {
    const rows = await manager.query<SubjectRecord[]>(
      `SELECT * FROM study_subjects WHERE user_id=? AND id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId, id],
    );
    if (!rows[0]) throw missing();
    return rows[0];
  }
  private async detailIn(
    manager: EntityManager,
    userId: string,
    id: string,
  ): Promise<StudySubject> {
    const row = await this.owned(manager, userId, id);
    const topics = await manager.query<{ name: string }[]>(
      'SELECT k.name FROM subject_known_topics k JOIN study_subjects s ON s.id=k.subject_id WHERE s.user_id=? AND s.id=? ORDER BY k.position,k.id',
      [userId, id],
    );
    const items = await this.items(manager, userId, id);
    return {
      id: row.id,
      name: row.name,
      currentLevel: row.current_level,
      objective: row.objective,
      dueDate: row.due_date,
      weeklyHours: Number(row.weekly_hours),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      knownTopics: topics.map((topic) => topic.name),
      planItems: items.map((item) => ({
        id: item.id,
        subjectId: item.subject_id,
        title: item.title,
        status: item.status,
        position: item.position,
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
      })),
    };
  }
  detail(userId: string, id: string) {
    return this.source.transaction((manager) =>
      this.detailIn(manager, userId, id),
    );
  }
  async list(userId: string, { page, pageSize }: SubjectPagination) {
    return this.source.transaction(async (manager) => {
      const rows = await manager.query<{ id: string }[]>(
        'SELECT id FROM study_subjects WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?',
        [userId, pageSize, (page - 1) * pageSize],
      );
      const counts = await manager.query<{ total: number }[]>(
        'SELECT COUNT(*) AS total FROM study_subjects WHERE user_id=?',
        [userId],
      );
      const items: StudySubject[] = [];
      for (const row of rows)
        items.push(await this.detailIn(manager, userId, row.id));
      return { items, total: Number(counts[0]!.total) };
    });
  }
  private async replaceTopics(
    manager: EntityManager,
    userId: string,
    id: string,
    topics: string[],
  ) {
    await manager.query(
      'DELETE k FROM subject_known_topics k JOIN study_subjects s ON s.id=k.subject_id WHERE s.user_id=? AND s.id=?',
      [userId, id],
    );
    for (const [position, name] of topics.entries())
      await manager.query(
        'INSERT INTO subject_known_topics (id,subject_id,name,position) SELECT ?,id,?,? FROM study_subjects WHERE user_id=? AND id=?',
        [randomUUID(), name, position, userId, id],
      );
  }
  create(userId: string, input: CreateSubject) {
    return this.source.transaction(async (manager) => {
      const id = randomUUID();
      await manager.query(
        'INSERT INTO study_subjects (id,user_id,name,current_level,objective,due_date,weekly_hours) VALUES (?,?,?,?,?,?,?)',
        [
          id,
          userId,
          input.name,
          input.currentLevel,
          input.objective,
          input.dueDate,
          input.weeklyHours,
        ],
      );
      await this.replaceTopics(manager, userId, id, input.knownTopics);
      return this.detailIn(manager, userId, id);
    });
  }
  update(userId: string, id: string, input: UpdateSubject) {
    return this.locked(userId, id, async (manager) => {
      const columns = {
        name: 'name',
        currentLevel: 'current_level',
        objective: 'objective',
        dueDate: 'due_date',
        weeklyHours: 'weekly_hours',
      } as const;
      const entries = Object.entries(input).filter(
        ([key, value]) => key !== 'knownTopics' && value !== undefined,
      ) as Array<[keyof typeof columns, unknown]>;
      if (entries.length)
        await manager.query(
          `UPDATE study_subjects SET ${entries.map(([key]) => `${columns[key]}=?`).join(',')} WHERE user_id=? AND id=?`,
          [...entries.map(([, value]) => value), userId, id],
        );
      if (input.knownTopics !== undefined)
        await this.replaceTopics(manager, userId, id, input.knownTopics);
    });
  }
  async delete(userId: string, id: string) {
    await this.source.transaction(async (manager) => {
      await this.owned(manager, userId, id, true);
      await manager.query(
        'DELETE FROM study_subjects WHERE user_id=? AND id=?',
        [userId, id],
      );
    });
  }
  private locked(
    userId: string,
    id: string,
    work: (manager: EntityManager) => Promise<void>,
  ) {
    return this.source.transaction(async (manager) => {
      await this.owned(manager, userId, id, true);
      await work(manager);
      return this.detailIn(manager, userId, id);
    });
  }
  private items(manager: EntityManager, userId: string, id: string) {
    return manager.query<ItemRecord[]>(
      'SELECT p.* FROM subject_plan_items p JOIN study_subjects s ON s.id=p.subject_id WHERE s.user_id=? AND s.id=? ORDER BY p.position,p.id',
      [userId, id],
    );
  }
  private async updateItem(
    manager: EntityManager,
    userId: string,
    id: string,
    itemId: string,
    input: UpdatePlanItem & { position?: number },
  ) {
    const entries = Object.entries(input).filter(
      ([, value]) => value !== undefined,
    );
    if (entries.length)
      await manager.query(
        `UPDATE subject_plan_items p JOIN study_subjects s ON s.id=p.subject_id SET ${entries.map(([key]) => `p.${key}=?`).join(',')} WHERE s.user_id=? AND s.id=? AND p.id=?`,
        [...entries.map(([, value]) => value), userId, id, itemId],
      );
  }
  addItem(
    userId: string,
    id: string,
    input: { title: string; status: ItemRecord['status'] },
  ) {
    return this.locked(userId, id, async (manager) => {
      const items = await this.items(manager, userId, id);
      await manager.query(
        'INSERT INTO subject_plan_items (id,subject_id,title,status,position) SELECT ?,id,?,?,? FROM study_subjects WHERE user_id=? AND id=?',
        [randomUUID(), input.title, input.status, items.length, userId, id],
      );
    });
  }
  editItem(userId: string, id: string, itemId: string, input: UpdatePlanItem) {
    return this.locked(userId, id, async (manager) => {
      if (
        !(await this.items(manager, userId, id)).some(
          (item) => item.id === itemId,
        )
      )
        throw missing();
      await this.updateItem(manager, userId, id, itemId, input);
    });
  }
  removeItem(userId: string, id: string, itemId: string) {
    return this.locked(userId, id, async (manager) => {
      const items = await this.items(manager, userId, id);
      if (!items.some((item) => item.id === itemId)) throw missing();
      await manager.query(
        'DELETE p FROM subject_plan_items p JOIN study_subjects s ON s.id=p.subject_id WHERE s.user_id=? AND s.id=? AND p.id=?',
        [userId, id, itemId],
      );
      for (const [position, item] of items
        .filter((item) => item.id !== itemId)
        .entries())
        await this.updateItem(manager, userId, id, item.id, { position });
    });
  }
  reorder(userId: string, id: string, ids: string[]) {
    return this.locked(userId, id, async (manager) => {
      const items = await this.items(manager, userId, id);
      if (ids.some((itemId) => !items.some((item) => item.id === itemId)))
        throw missing();
      if (ids.length !== items.length || new Set(ids).size !== ids.length)
        throw new HttpError(
          400,
          'INVALID_INPUT',
          'Envie a sequência completa, sem repetir itens.',
        );
      for (const [position, itemId] of ids.entries())
        await this.updateItem(manager, userId, id, itemId, { position });
    });
  }
}
