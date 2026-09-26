import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import type {
  RoadmapContent,
  Roadmap,
  SubjectPagination,
  RoadmapDraft,
  PersistedRoadmapContent,
  RoadmapRevision,
} from '@study-platform/contracts';
import { roadmapRevisionSchema } from '@study-platform/contracts';
import { manualContent, revisionConflict } from './roadmap-sequence.js';
import { HttpError } from '../../shared/http-error.js';
interface Row {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  revision: number;
}
interface Child {
  id: string;
  title: string;
  description: string;
  position: number;
}
const missing = () =>
  new HttpError(404, 'ROADMAP_NOT_FOUND', 'Roadmap não encontrado.');
export class RoadmapsRepository {
  constructor(private readonly source: DataSource) {}
  private async own(
    manager: EntityManager,
    userId: string,
    subjectId: string,
    lock = false,
  ) {
    const rows = await manager.query<{ id: string }[]>(
      `SELECT id FROM study_subjects WHERE user_id=? AND id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId, subjectId],
    );
    if (!rows.length)
      throw new HttpError(404, 'SUBJECT_NOT_FOUND', 'Matéria não encontrada.');
  }
  private async detailIn(
    manager: EntityManager,
    userId: string,
    subjectId: string,
    id: string,
  ): Promise<Roadmap> {
    const rows = await manager.query<Row[]>(
      'SELECT r.* FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=?',
      [userId, subjectId, id],
    );
    const row = rows[0];
    if (!row) throw missing();
    const blocks = await manager.query<Child[]>(
      'SELECT b.* FROM subject_roadmap_blocks b JOIN subject_roadmaps r ON r.id=b.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? ORDER BY b.position,b.id',
      [userId, subjectId, id],
    );
    const steps = await manager.query<
      Array<Child & { block_id: string; completed: number }>
    >(
      'SELECT p.* FROM subject_roadmap_steps p JOIN subject_roadmap_blocks b ON b.id=p.block_id JOIN subject_roadmaps r ON r.id=b.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? ORDER BY b.position,p.position,p.id',
      [userId, subjectId, id],
    );
    return {
      id: row.id,
      subjectId: row.subject_id,
      title: row.title,
      description: row.description,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      revision: row.revision,
      blocks: blocks.map((block) => ({
        title: block.title,
        description: block.description,
        steps: steps
          .filter((step) => step.block_id === block.id)
          .map((step) => ({
            id: step.id,
            completed: Boolean(step.completed),
            title: step.title,
            description: step.description,
          })),
      })),
    };
  }
  detail(userId: string, subjectId: string, id: string) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId);
      return this.detailIn(manager, userId, subjectId, id);
    });
  }
  list(
    userId: string,
    subjectId: string,
    { page, pageSize }: SubjectPagination,
  ) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId);
      const rows = await manager.query<{ id: string }[]>(
        'SELECT r.id FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? ORDER BY r.created_at DESC,r.id DESC LIMIT ? OFFSET ?',
        [userId, subjectId, pageSize, (page - 1) * pageSize],
      );
      const counts = await manager.query<{ total: number }[]>(
        'SELECT COUNT(*) AS total FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=?',
        [userId, subjectId],
      );
      const items: Roadmap[] = [];
      for (const row of rows)
        items.push(await this.detailIn(manager, userId, subjectId, row.id));
      return {
        items,
        page,
        pageSize,
        total: Number(counts[0]!.total),
        totalPages: Math.ceil(Number(counts[0]!.total) / pageSize),
      };
    });
  }
  private async children(
    manager: EntityManager,
    userId: string,
    subjectId: string,
    id: string,
    input: RoadmapDraft,
  ) {
    await manager.query(
      'DELETE b FROM subject_roadmap_blocks b JOIN subject_roadmaps r ON r.id=b.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=?',
      [userId, subjectId, id],
    );
    for (const [position, block] of input.blocks.entries()) {
      const blockId = randomUUID();
      await manager.query(
        'INSERT INTO subject_roadmap_blocks (id,roadmap_id,title,description,position) SELECT ?,r.id,?,?,? FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=?',
        [
          blockId,
          block.title,
          block.description,
          position,
          userId,
          subjectId,
          id,
        ],
      );
      for (const [stepPosition, step] of block.steps.entries())
        await manager.query(
          'INSERT INTO subject_roadmap_steps (id,block_id,title,description,position,completed) SELECT ?,b.id,?,?,?,? FROM subject_roadmap_blocks b JOIN subject_roadmaps r ON r.id=b.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? AND b.id=?',
          [
            step.id ?? randomUUID(),
            step.title,
            step.description,
            stepPosition,
            step.completed ?? false,
            userId,
            subjectId,
            id,
            blockId,
          ],
        );
    }
  }
  create(
    userId: string,
    subjectId: string,
    input: RoadmapContent,
    generationId: string | null = null,
  ) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId, true);
      if (generationId) {
        const rows = await manager.query<{ id: string }[]>(
          'SELECT r.id FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.generation_id=?',
          [userId, subjectId, generationId],
        );
        if (rows[0])
          return this.detailIn(manager, userId, subjectId, rows[0].id);
      }
      const id = randomUUID();
      await manager.query(
        'INSERT INTO subject_roadmaps (id,subject_id,title,description,generation_id) SELECT ?,id,?,?,? FROM study_subjects WHERE user_id=? AND id=?',
        [id, input.title, input.description, generationId, userId, subjectId],
      );
      await this.children(manager, userId, subjectId, id, input);
      const saved = await this.detailIn(manager, userId, subjectId, id);
      await this.snapshotIn(
        manager,
        userId,
        subjectId,
        saved,
        generationId ? 'ia' : 'manual',
        null,
        null,
      );
      return saved;
    });
  }
  update(
    userId: string,
    subjectId: string,
    id: string,
    input: RoadmapDraft & { baseRevision: number },
  ) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId, true);
      const current = await this.detailIn(manager, userId, subjectId, id);
      if (current.revision !== input.baseRevision) throw revisionConflict();
      await this.replaceIn(
        manager,
        userId,
        subjectId,
        current,
        manualContent(current, input),
        'manual',
        null,
        null,
      );
      return this.detailIn(manager, userId, subjectId, id);
    });
  }
  private async snapshotIn(
    manager: EntityManager,
    userId: string,
    subjectId: string,
    current: Roadmap,
    origin: RoadmapRevision['origin'],
    sourceRevision: number | null,
    actionId: string | null,
  ) {
    const content = {
      title: current.title,
      description: current.description,
      blocks: current.blocks,
    };
    await manager.query(
      'INSERT INTO subject_roadmap_revisions (roadmap_id,revision,origin,source_revision,content,action_id) SELECT r.id,?,?,?,?,? FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=?',
      [
        current.revision,
        origin,
        sourceRevision,
        JSON.stringify(content),
        actionId,
        userId,
        subjectId,
        current.id,
      ],
    );
  }
  private async revisionIn(
    manager: EntityManager,
    userId: string,
    subjectId: string,
    id: string,
    revision: number,
  ) {
    const rows = await manager.query<
      Array<{
        revision: number;
        origin: RoadmapRevision['origin'];
        source_revision: number | null;
        content: unknown;
        created_at: Date;
      }>
    >(
      'SELECT v.* FROM subject_roadmap_revisions v JOIN subject_roadmaps r ON r.id=v.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? AND v.revision=?',
      [userId, subjectId, id, revision],
    );
    const row = rows[0];
    if (!row)
      throw new HttpError(404, 'REVISION_NOT_FOUND', 'Revisão não encontrada.');
    return roadmapRevisionSchema.parse({
      roadmapId: id,
      revision: row.revision,
      origin: row.origin,
      sourceRevision: row.source_revision,
      createdAt: row.created_at.toISOString(),
      content:
        typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
    });
  }
  revision(userId: string, subjectId: string, id: string, revision: number) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId);
      return this.revisionIn(manager, userId, subjectId, id, revision);
    });
  }
  history(
    userId: string,
    subjectId: string,
    id: string,
    { page, pageSize }: SubjectPagination,
  ) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId);
      await this.detailIn(manager, userId, subjectId, id);
      const rows = await manager.query<Array<{ revision: number }>>(
        'SELECT v.revision FROM subject_roadmap_revisions v JOIN subject_roadmaps r ON r.id=v.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? ORDER BY v.revision DESC LIMIT ? OFFSET ?',
        [userId, subjectId, id, pageSize, (page - 1) * pageSize],
      );
      const counts = await manager.query<Array<{ total: number }>>(
        'SELECT COUNT(*) AS total FROM subject_roadmap_revisions v JOIN subject_roadmaps r ON r.id=v.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=?',
        [userId, subjectId, id],
      );
      const items: RoadmapRevision[] = [];
      for (const row of rows)
        items.push(
          await this.revisionIn(manager, userId, subjectId, id, row.revision),
        );
      return {
        items,
        ...{ page, pageSize },
        total: Number(counts[0]!.total),
        totalPages: Math.ceil(Number(counts[0]!.total) / pageSize),
      };
    });
  }
  private async replaceIn(
    manager: EntityManager,
    userId: string,
    subjectId: string,
    current: Roadmap,
    content: PersistedRoadmapContent,
    origin: RoadmapRevision['origin'],
    sourceRevision: number | null,
    actionId: string | null,
  ) {
    await manager.query(
      'UPDATE subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id SET r.title=?,r.description=?,r.revision=r.revision+1,r.updated_at=UTC_TIMESTAMP(3) WHERE s.user_id=? AND s.id=? AND r.id=?',
      [content.title, content.description, userId, subjectId, current.id],
    );
    await this.children(manager, userId, subjectId, current.id, content);
    const saved = await this.detailIn(manager, userId, subjectId, current.id);
    await this.snapshotIn(
      manager,
      userId,
      subjectId,
      saved,
      origin,
      sourceRevision,
      actionId,
    );
    return this.revisionIn(
      manager,
      userId,
      subjectId,
      current.id,
      saved.revision,
    );
  }
  confirm(
    userId: string,
    subjectId: string,
    id: string,
    baseRevision: number,
    actionId: string | null,
    origin: RoadmapRevision['origin'],
    sourceRevision: number | null,
    compose: (current: Roadmap) => PersistedRoadmapContent,
  ) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId, true);
      await manager.query(
        'SELECT r.id FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? FOR UPDATE',
        [userId, subjectId, id],
      );
      const current = await this.detailIn(manager, userId, subjectId, id);
      if (actionId) {
        const existing = await manager.query<Array<{ revision: number }>>(
          'SELECT v.revision FROM subject_roadmap_revisions v JOIN subject_roadmaps r ON r.id=v.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? AND v.action_id=?',
          [userId, subjectId, id, actionId],
        );
        if (existing[0])
          return this.revisionIn(
            manager,
            userId,
            subjectId,
            id,
            existing[0].revision,
          );
      }
      if (current.revision !== baseRevision) throw revisionConflict();
      return this.replaceIn(
        manager,
        userId,
        subjectId,
        current,
        compose(current),
        origin,
        sourceRevision,
        actionId,
      );
    });
  }
  delete(userId: string, subjectId: string, id: string) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId, true);
      await this.detailIn(manager, userId, subjectId, id);
      await manager.query(
        'DELETE r FROM subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=?',
        [userId, subjectId, id],
      );
    });
  }
}
