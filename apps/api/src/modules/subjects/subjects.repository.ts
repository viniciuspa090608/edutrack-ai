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
import { RoadmapsRepository } from './roadmaps.repository.js';
import { publishActivity } from '../analytics/activity-publisher.js';
import { lockStudyProgress } from '../study-progress/activity-recorder.js';
import { resolveClassroomConflict } from '../../shared/classroom-conflict.js';
import type {
  ClassroomSubjectImport,
  ClassroomImportResult,
} from '@study-platform/contracts';
import {
  decode,
  importOrigin,
  importReceipt,
  importedMerge,
  importResult,
  saveImportReceipt,
  nextImportSnapshot,
} from '../../shared/classroom-import.js';

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
  async classroomSource(userId: string, id: string) {
    const rows = await this.source.query<
      Array<{ id: string; provenance: unknown; conflict: unknown }>
    >(
      'SELECT id,provenance,conflict FROM subject_classroom_sources WHERE user_id=? AND local_id=?',
      [userId, id],
    );
    return rows.map((row) => ({
      id: row.id,
      source: decode(row.provenance),
      conflict: row.conflict ? decode(row.conflict) : null,
    }));
  }
  resolveClassroom(
    userId: string,
    id: string,
    revision: number,
    choice: 'keep_local' | 'accept_remote',
  ) {
    return this.source.transaction(async (manager) => {
      await lockStudyProgress(manager, userId);
      await resolveClassroomConflict(
        manager,
        'subject',
        userId,
        id,
        revision,
        choice,
        async (localId) => {
          const row = await this.owned(manager, userId, localId, true);
          return { name: row.name };
        },
        async (localId, fields) => {
          if (
            typeof fields.name !== 'string' ||
            fields.name.trim().length < 1 ||
            fields.name.length > 120
          )
            throw new HttpError(
              400,
              'INVALID_INPUT',
              'Nome remoto excede o limite permitido.',
            );
          await manager.query(
            'UPDATE study_subjects SET name=? WHERE user_id=? AND id=?',
            [fields.name, userId, localId],
          );
        },
      );
    });
  }
  readonly roadmaps: RoadmapsRepository;
  requireOwnedForImport(manager: EntityManager, userId: string, id: string) {
    return this.owned(manager, userId, id, true);
  }
  constructor(private readonly source: DataSource) {
    this.roadmaps = new RoadmapsRepository(source);
  }
  async importClassroom(
    manager: EntityManager,
    userId: string,
    input: ClassroomSubjectImport,
  ): Promise<ClassroomImportResult> {
    const receipt = await importReceipt(
      manager,
      'subject',
      userId,
      input.receiptId,
    );
    if (receipt) return receipt;
    await lockStudyProgress(manager, userId);
    const origin = await importOrigin(
      manager,
      'subject',
      userId,
      input.googleSubject,
      input.course.id,
      input.course.id,
    );
    const finish = (result: ClassroomImportResult) =>
      saveImportReceipt(manager, 'subject', userId, input.receiptId, result);
    if (origin && !origin.local_id && !input.restoreDeleted)
      return finish(
        importResult(
          null,
          'ignored',
          'Matéria excluída localmente. Restaure explicitamente.',
        ),
      );
    let subjectId = origin?.local_id;
    const destination = input.destination;
    if (destination.kind === 'none')
      return finish(
        importResult(
          null,
          'ignored',
          'Selecione ou preencha uma matéria para esta turma.',
        ),
      );
    if (
      destination.kind === 'existing' &&
      subjectId &&
      subjectId !== destination.subjectId &&
      !input.confirmDestinationChange
    )
      return finish(
        importResult(
          subjectId,
          'error',
          'Confirme a mudança de matéria de destino.',
        ),
      );
    const associated =
      destination.kind === 'existing' &&
      (!origin?.local_id ||
        origin.local_id !== destination.subjectId ||
        decode<{ associated: boolean }>(origin.provenance).associated);
    if (destination.kind === 'existing') {
      await this.owned(manager, userId, destination.subjectId, true);
      subjectId = destination.subjectId;
    }
    let added = false;
    if (!subjectId) {
      if (destination.kind !== 'new')
        return finish(
          importResult(null, 'error', 'Preencha os dados da matéria.'),
        );
      subjectId = randomUUID();
      const data = destination.subject;
      await manager.query(
        'INSERT INTO study_subjects(id,user_id,name,current_level,objective,due_date,weekly_hours) VALUES (?,?,?,?,?,?,?)',
        [
          subjectId,
          userId,
          data.name,
          data.currentLevel,
          data.objective,
          data.dueDate,
          data.weeklyHours,
        ],
      );
      await this.replaceTopics(manager, userId, subjectId, data.knownTopics);
      added = true;
    }
    const remote = { name: input.course.name };
    const provenance = { course: input.course, associated };
    if (!origin) {
      await manager.query(
        'INSERT INTO subject_classroom_sources(id,user_id,google_subject,course_id,item_id,local_id,snapshot,provenance) VALUES (?,?,?,?,?,?,?,?)',
        [
          randomUUID(),
          userId,
          input.googleSubject,
          input.course.id,
          input.course.id,
          subjectId,
          JSON.stringify(remote),
          JSON.stringify(provenance),
        ],
      );
      return finish(importResult(subjectId, added ? 'added' : 'unchanged'));
    }
    let result = importResult(subjectId, added ? 'added' : 'unchanged');
    if (!associated && !added) {
      const row = await this.owned(manager, userId, subjectId, true);
      const merge = importedMerge(
        { name: row.name },
        decode<Record<string, unknown>>(origin.snapshot),
        remote,
      );
      if (
        typeof merge.updates.name === 'string' &&
        merge.updates.name.length <= 120
      ) {
        await manager.query(
          'UPDATE study_subjects SET name=? WHERE user_id=? AND id=?',
          [merge.updates.name, userId, subjectId],
        );
        result = importResult(subjectId, 'updated');
      } else if (merge.updates.name)
        result = importResult(
          subjectId,
          'error',
          'Nome da turma excede o limite de 120 caracteres.',
        );
      if (merge.conflicts.length)
        result = {
          ...importResult(subjectId, 'conflict'),
          conflict: {
            id: origin.id,
            localId: subjectId,
            revision: origin.revision + 1,
            fields: merge.conflicts as NonNullable<
              ClassroomImportResult['conflict']
            >['fields'],
          },
        };
    }
    await manager.query(
      'UPDATE subject_classroom_sources SET local_id=?,snapshot=?,provenance=?,revision=revision+1,conflict=?,deleted=false WHERE user_id=? AND id=?',
      [
        subjectId,
        JSON.stringify(
          nextImportSnapshot(
            decode<Record<string, unknown>>(origin.snapshot),
            remote,
            result.conflict?.fields ?? [],
          ),
        ),
        JSON.stringify(provenance),
        result.conflict ? JSON.stringify(result.conflict) : null,
        userId,
        origin.id,
      ],
    );
    return finish(result);
  }
  dashboardCandidate(userId: string) {
    return this.source.transaction(async (manager) => {
      const rows = await manager.query<
        Array<{ id: string; has_pending: number }>
      >(
        `SELECT s.id,
        (EXISTS(SELECT 1 FROM subject_plan_items i WHERE i.subject_id=s.id AND i.status<>'COMPLETED') OR EXISTS(SELECT 1 FROM subject_roadmap_steps p JOIN subject_roadmap_blocks b ON b.id=p.block_id JOIN subject_roadmaps r ON r.id=b.roadmap_id WHERE r.subject_id=s.id AND p.completed=false)) AS has_pending
        FROM study_subjects s WHERE s.user_id=? ORDER BY has_pending DESC, CASE WHEN has_pending THEN s.due_date END ASC,s.updated_at DESC,s.id ASC LIMIT 1`,
        [userId],
      );
      const candidate = rows[0];
      if (!candidate) return null;
      const subject = await this.detailIn(manager, userId, candidate.id);
      return { subject, hasPending: Boolean(candidate.has_pending) };
    });
  }
  private async owned(
    manager: EntityManager,
    userId: string,
    id: string,
    lock = false,
  ) {
    if (lock) await lockStudyProgress(manager, userId);
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
      const itemId = randomUUID();
      await manager.query(
        'INSERT INTO subject_plan_items (id,subject_id,title,status,position) SELECT ?,id,?,?,? FROM study_subjects WHERE user_id=? AND id=?',
        [itemId, input.title, input.status, items.length, userId, id],
      );
      if (input.status === 'COMPLETED')
        await publishActivity(
          manager,
          userId,
          'SUBJECT_PLAN_ITEM_COMPLETED',
          'plan-item',
          itemId,
          undefined,
          undefined,
          false,
        );
    });
  }
  editItem(userId: string, id: string, itemId: string, input: UpdatePlanItem) {
    return this.locked(userId, id, async (manager) => {
      const previous = (await this.items(manager, userId, id)).find(
        (item) => item.id === itemId,
      );
      if (!previous) throw missing();
      await this.updateItem(manager, userId, id, itemId, input);
      if (previous?.status !== 'COMPLETED' && input.status === 'COMPLETED')
        await publishActivity(
          manager,
          userId,
          'SUBJECT_PLAN_ITEM_COMPLETED',
          'plan-item',
          itemId,
        );
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
