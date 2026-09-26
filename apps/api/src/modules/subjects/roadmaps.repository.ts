import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import type {
  RoadmapContent,
  Roadmap,
  SubjectPagination,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
interface Row {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  created_at: Date;
  updated_at: Date;
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
    const steps = await manager.query<Array<Child & { block_id: string }>>(
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
      blocks: blocks.map((block) => ({
        title: block.title,
        description: block.description,
        steps: steps
          .filter((step) => step.block_id === block.id)
          .map((step) => ({
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
    input: RoadmapContent,
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
          'INSERT INTO subject_roadmap_steps (id,block_id,title,description,position) SELECT ?,b.id,?,?,? FROM subject_roadmap_blocks b JOIN subject_roadmaps r ON r.id=b.roadmap_id JOIN study_subjects s ON s.id=r.subject_id WHERE s.user_id=? AND s.id=? AND r.id=? AND b.id=?',
          [
            randomUUID(),
            step.title,
            step.description,
            stepPosition,
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
      return this.detailIn(manager, userId, subjectId, id);
    });
  }
  update(userId: string, subjectId: string, id: string, input: RoadmapContent) {
    return this.source.transaction(async (manager) => {
      await this.own(manager, userId, subjectId, true);
      await this.detailIn(manager, userId, subjectId, id);
      await manager.query(
        'UPDATE subject_roadmaps r JOIN study_subjects s ON s.id=r.subject_id SET r.title=?,r.description=?,r.updated_at=UTC_TIMESTAMP(3) WHERE s.user_id=? AND s.id=? AND r.id=?',
        [input.title, input.description, userId, subjectId, id],
      );
      await this.children(manager, userId, subjectId, id, input);
      return this.detailIn(manager, userId, subjectId, id);
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
