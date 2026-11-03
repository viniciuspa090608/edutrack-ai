import { createHash, randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import { classroomOperationResultSchema } from '@study-platform/contracts';
import type {
  ClassroomOperationItem,
  ClassroomSelection,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { json } from './classroom.repository.js';

export interface OperationRow {
  checkpoint: { timeZone: string } | string | null;
  id: string;
  user_id: string;
  request_id: string;
  connection_version: number;
  google_subject: string;
  kind: 'import';
  state:
    'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
  phase: string;
  selection: ClassroomSelection | string;
  processed: number;
  total: number | null;
  message: string | null;
  created_at: Date;
  updated_at: Date;
  lease_owner: string | null;
  attempts: number;
}
export class ClassroomOperationsRepository {
  constructor(private readonly source: DataSource) {}
  async start(
    manager: EntityManager,
    userId: string,
    version: number,
    googleSubject: string,
    requestId: string,
    kind: 'import',
    selection: ClassroomSelection,
    timeZone = 'UTC',
  ) {
    const existing = await manager.query<Array<{ id: string }>>(
      'SELECT id FROM classroom_operations WHERE user_id=? AND (request_id=? OR active_marker=1) ORDER BY created_at DESC LIMIT 1 FOR UPDATE',
      [userId, requestId],
    );
    if (existing[0]) return existing[0].id;
    const id = randomUUID();
    await manager.query(
      'INSERT INTO classroom_operations(id,user_id,request_id,connection_version,google_subject,kind,selection,checkpoint) VALUES (?,?,?,?,?,?,?,?)',
      [
        id,
        userId,
        requestId,
        version,
        googleSubject,
        kind,
        JSON.stringify(selection),
        JSON.stringify({ timeZone }),
      ],
    );
    return id;
  }
  async latest(userId: string) {
    const rows = await this.source.query<Array<{ id: string }>>(
      "SELECT id FROM classroom_operations WHERE user_id=? AND kind='import' ORDER BY created_at DESC,id DESC LIMIT 1",
      [userId],
    );
    return rows[0] ? this.result(userId, rows[0].id, 1, 20) : null;
  }
  async result(userId: string, id: string, page: number, pageSize: number) {
    const rows = await this.source.query<OperationRow[]>(
      'SELECT * FROM classroom_operations WHERE user_id=? AND id=?',
      [userId, id],
    );
    const row = rows[0];
    if (!row)
      throw new HttpError(
        404,
        'CLASSROOM_OPERATION_NOT_FOUND',
        'Operação não encontrada.',
      );
    const items = await this.source.query<
      Array<{
        id: string;
        entity: string;
        external_id: string;
        course_id: string;
        title: string;
        outcome: string;
        reason: string | null;
        local_id: string | null;
        conflict_id: string | null;
      }>
    >(
      'SELECT * FROM classroom_operation_items WHERE user_id=? AND operation_id=? ORDER BY id LIMIT ? OFFSET ?',
      [userId, id, pageSize, (page - 1) * pageSize],
    );
    const totals = await this.source.query<
      Array<{ entity: string; outcome: string; total: string }>
    >(
      'SELECT entity,outcome,COUNT(*) total FROM classroom_operation_items WHERE user_id=? AND operation_id=? GROUP BY entity,outcome',
      [userId, id],
    );
    const empty = () => ({
      added: 0,
      updated: 0,
      unchanged: 0,
      ignored: 0,
      conflict: 0,
      error: 0,
    });
    const counts = {
      subjects: empty(),
      tasks: empty(),
    };
    let totalItems = 0;
    for (const item of totals) {
      totalItems += Number(item.total);
      const key =
        item.entity === 'subject'
          ? 'subjects'
          : item.entity === 'task'
            ? 'tasks'
            : null;
      if (key && item.outcome in counts[key])
        counts[key][item.outcome as keyof ReturnType<typeof empty>] += Number(
          item.total,
        );
    }
    return classroomOperationResultSchema.parse({
      operation: {
        id,
        kind: row.kind,
        state: row.state,
        phase: row.phase,
        processed: row.processed,
        total: row.total,
        counts,
        message: row.message,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      },
      items: items.map((item) => ({
        id: item.id,
        entity: item.entity,
        externalId: item.external_id,
        courseId: item.course_id,
        title: item.title,
        outcome: item.outcome,
        reason: item.reason,
        localId: item.local_id,
        conflictId: item.conflict_id,
      })),
      page,
      totalItems,
    });
  }
  async claim(worker: string) {
    return this.source.transaction(async (manager) => {
      const rows = await manager.query<OperationRow[]>(
        "SELECT * FROM classroom_operations WHERE kind='import' AND state IN ('queued','running') AND available_at<=UTC_TIMESTAMP(3) AND (lease_until IS NULL OR lease_until<UTC_TIMESTAMP(3)) ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED",
      );
      const row = rows[0];
      if (!row) return null;
      if (row.attempts >= 5) {
        await manager.query(
          "UPDATE classroom_operations SET state='failed',phase='finished',active_marker=NULL,lease_owner=NULL,lease_until=NULL,message='Processamento interrompido repetidamente. Tente novamente.' WHERE user_id=? AND id=?",
          [row.user_id, row.id],
        );
        return null;
      }
      await manager.query(
        "UPDATE classroom_operations SET state='running',phase='discovering',lease_owner=?,lease_until=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 90 SECOND),attempts=attempts+1 WHERE id=? AND user_id=?",
        [worker, row.id, row.user_id],
      );
      return {
        ...row,
        lease_owner: worker,
        selection: json<ClassroomSelection>(row.selection),
      };
    });
  }
  async heartbeat(row: OperationRow, phase?: string) {
    const result = await this.source.query<{ affectedRows: number }>(
      `UPDATE classroom_operations SET lease_until=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 90 SECOND)${phase ? ',phase=?' : ''} WHERE user_id=? AND id=? AND lease_owner=? AND state='running'`,
      [...(phase ? [phase] : []), row.user_id, row.id, row.lease_owner],
    );
    if (!result.affectedRows)
      throw new HttpError(
        409,
        'CLASSROOM_OPERATION_STOPPED',
        'Operação interrompida.',
      );
  }
  key(entity: string, courseId: string, externalId: string) {
    return createHash('sha256')
      .update(JSON.stringify([entity, courseId, externalId]))
      .digest();
  }
  async item(row: OperationRow, item: Omit<ClassroomOperationItem, 'id'>) {
    await this.source.transaction(async (manager) => {
      const active = await manager.query<Array<{ id: string }>>(
        "SELECT id FROM classroom_operations WHERE user_id=? AND id=? AND lease_owner=? AND state='running' FOR UPDATE",
        [row.user_id, row.id, row.lease_owner],
      );
      if (!active[0])
        throw new HttpError(
          409,
          'CLASSROOM_OPERATION_STOPPED',
          'Operação interrompida.',
        );
      await manager.query(
        "INSERT INTO classroom_operation_items(id,operation_id,user_id,item_key,entity,external_id,course_id,title,outcome,reason,local_id,conflict_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE outcome=IF(outcome IN ('added','updated') AND VALUES(outcome)='unchanged',outcome,VALUES(outcome)),reason=VALUES(reason),local_id=VALUES(local_id),conflict_id=VALUES(conflict_id)",
        [
          randomUUID(),
          row.id,
          row.user_id,
          this.key(item.entity, item.courseId, item.externalId),
          item.entity,
          item.externalId,
          item.courseId,
          item.title,
          item.outcome,
          item.reason,
          item.localId,
          item.conflictId,
        ],
      );
      await manager.query(
        'UPDATE classroom_operations SET processed=(SELECT COUNT(*) FROM classroom_operation_items WHERE operation_id=? AND user_id=?) WHERE id=? AND user_id=?',
        [row.id, row.user_id, row.id, row.user_id],
      );
    });
  }
  async finish(row: OperationRow, message: string | null = null) {
    const totals = await this.source.query<
      Array<{ entity: string; outcome: string; total: string }>
    >(
      'SELECT entity,outcome,COUNT(*) total FROM classroom_operation_items WHERE user_id=? AND operation_id=? GROUP BY entity,outcome',
      [row.user_id, row.id],
    );
    const successes = totals
      .filter((item) =>
        ['added', 'updated', 'unchanged'].includes(item.outcome),
      )
      .reduce((n, item) => n + Number(item.total), 0);
    const pending = totals
      .filter((item) => ['error', 'conflict', 'ignored'].includes(item.outcome))
      .reduce((n, item) => n + Number(item.total), 0);
    const state =
      pending || message ? (successes ? 'partial' : 'failed') : 'completed';
    await this.source.query(
      "UPDATE classroom_operations SET state=?,phase='finished',active_marker=NULL,total=processed,message=?,lease_owner=NULL,lease_until=NULL WHERE user_id=? AND id=? AND lease_owner=? AND state='running'",
      [state, message, row.user_id, row.id, row.lease_owner],
    );
  }
  async retry(userId: string, id: string) {
    return this.source.transaction(async (manager) => {
      const rows = await manager.query<OperationRow[]>(
        'SELECT * FROM classroom_operations WHERE user_id=? AND id=? FOR UPDATE',
        [userId, id],
      );
      if (!rows[0])
        throw new HttpError(
          404,
          'CLASSROOM_OPERATION_NOT_FOUND',
          'Operação não encontrada.',
        );
      const active = await manager.query<Array<{ id: string }>>(
        'SELECT id FROM classroom_operations WHERE user_id=? AND active_marker=1',
        [userId],
      );
      if (active[0]) return active[0].id;
      await manager.query(
        "DELETE FROM classroom_operation_items WHERE user_id=? AND operation_id=? AND outcome IN ('error','ignored')",
        [userId, id],
      );
      await manager.query(
        "UPDATE classroom_operations SET state='queued',phase='queued',active_marker=1,lease_owner=NULL,lease_until=NULL,attempts=0,available_at=UTC_TIMESTAMP(3),message=NULL WHERE user_id=? AND id=?",
        [userId, id],
      );
      return id;
    });
  }
}
