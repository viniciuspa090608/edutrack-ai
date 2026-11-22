import type { DataSource } from 'typeorm';
import {
  subjectGoalSchema,
  type SubjectGoalInput,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';

export class SubjectGoalsRepository {
  constructor(private readonly source: DataSource) {}
  async read(userId: string, subjectId: string) {
    const rows = await this.source.query<
      Array<SubjectGoalInput & { started_at: Date }>
    >(
      'SELECT indicator,target,due_date AS dueDate,time_zone AS timeZone,started_at FROM subject_goals WHERE user_id=? AND subject_id=?',
      [userId, subjectId],
    );
    const row = rows[0];
    return row
      ? subjectGoalSchema.parse({
          indicator: row.indicator,
          target: Number(row.target),
          dueDate: row.dueDate,
          timeZone: row.timeZone,
          startedAt: row.started_at.toISOString(),
        })
      : null;
  }
  async save(
    userId: string,
    subjectId: string,
    input: SubjectGoalInput,
    now: Date,
  ) {
    await this.source.transaction(async (manager) => {
      // Lock the parent to serialize simultaneous first saves and deletion.
      const rows = await manager.query<Array<{ id: string }>>(
        'SELECT id FROM study_subjects WHERE user_id=? AND id=? FOR UPDATE',
        [userId, subjectId],
      );
      if (!rows.length)
        throw new HttpError(
          404,
          'SUBJECT_NOT_FOUND',
          'Disciplina não encontrada.',
        );
      await manager.query(
        `INSERT INTO subject_goals(subject_id,user_id,indicator,target,due_date,time_zone,started_at)
        VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
        started_at=IF(indicator=VALUES(indicator),started_at,VALUES(started_at)),
        indicator=VALUES(indicator),target=VALUES(target),due_date=VALUES(due_date),time_zone=VALUES(time_zone)`,
        [
          subjectId,
          userId,
          input.indicator,
          input.target,
          input.dueDate,
          input.timeZone,
          now,
        ],
      );
    });
  }
}
