import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import type { PomodoroSession } from '@study-platform/contracts';
import { lockStudyProgress } from '../study-progress/activity-recorder.js';

export interface SessionRecord {
  id: string;
  user_id: string;
  task_id: string | null;
  subject_id: string | null;
  state: PomodoroSession['state'];
  active_ms: number;
  completed_blocks: number;
  running_since: Date | null;
  started_at: Date;
  ended_at: Date | null;
  version: number;
}
export type PomodoroClock = (manager: EntityManager) => Promise<Date>;
export class PomodoroRepository {
  constructor(
    private readonly source: DataSource,
    private readonly clock: PomodoroClock = async (manager) => {
      const rows = (await manager.query('SELECT UTC_TIMESTAMP(3) AS now')) as {
        now: Date;
      }[];
      return rows[0]!.now;
    },
  ) {}
  transaction<T>(work: (manager: EntityManager) => Promise<T>) {
    return this.source.transaction(work);
  }
  now(manager: EntityManager) {
    return this.clock(manager);
  }
  async lockOwner(manager: EntityManager, userId: string) {
    await lockStudyProgress(manager, userId);
    await manager.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [
      userId,
    ]);
  }
  async find(manager: EntityManager, userId: string, id: string, lock = false) {
    const rows = (await manager.query(
      `SELECT * FROM pomodoro_sessions WHERE user_id = ? AND id = ?${lock ? ' FOR UPDATE' : ''}`,
      [userId, id],
    )) as SessionRecord[];
    return rows[0] ?? null;
  }
  async current(manager: EntityManager, userId: string) {
    const rows = (await manager.query(
      'SELECT session_id FROM pomodoro_open_sessions WHERE user_id = ?',
      [userId],
    )) as { session_id: string }[];
    return rows[0] ? this.find(manager, userId, rows[0].session_id) : null;
  }
  async create(
    manager: EntityManager,
    userId: string,
    taskId: string | null,
    subjectId: string | null,
    now: Date,
  ) {
    const id = randomUUID();
    await manager.query(
      "INSERT INTO pomodoro_sessions (id,user_id,task_id,subject_id,state,running_since,started_at) VALUES (?,?,?,?,'RUNNING',?,?)",
      [id, userId, taskId, subjectId, now, now],
    );
    await manager.query(
      'INSERT INTO pomodoro_open_sessions (user_id,session_id) VALUES (?,?)',
      [userId, id],
    );
    return (await this.find(manager, userId, id))!;
  }
  async save(manager: EntityManager, row: SessionRecord) {
    await manager.query(
      'UPDATE pomodoro_sessions SET state=?,active_ms=?,completed_blocks=?,running_since=?,ended_at=?,version=? WHERE id=? AND user_id=?',
      [
        row.state,
        row.active_ms,
        row.completed_blocks,
        row.running_since,
        row.ended_at,
        row.version,
        row.id,
        row.user_id,
      ],
    );
    if (row.ended_at)
      await manager.query(
        'DELETE FROM pomodoro_open_sessions WHERE user_id=? AND session_id=?',
        [row.user_id, row.id],
      );
  }
  async history(
    manager: EntityManager,
    userId: string,
    page: number,
    pageSize: number,
    subjectId?: string,
  ) {
    const items = (await manager.query(
      `SELECT * FROM pomodoro_sessions WHERE user_id=? AND state IN ('COMPLETED','CANCELED') ${subjectId ? 'AND subject_id=?' : ''} ORDER BY started_at DESC,id DESC LIMIT ? OFFSET ?`,
      [
        userId,
        ...(subjectId ? [subjectId] : []),
        pageSize,
        (page - 1) * pageSize,
      ],
    )) as SessionRecord[];
    const rows = (await manager.query(
      `SELECT COUNT(*) AS total FROM pomodoro_sessions WHERE user_id=? AND state IN ('COMPLETED','CANCELED') ${subjectId ? 'AND subject_id=?' : ''}`,
      [userId, ...(subjectId ? [subjectId] : [])],
    )) as { total: number }[];
    return { items, total: Number(rows[0]!.total) };
  }
  async summary(manager: EntityManager, userId: string) {
    const rows = (await manager.query(
      "SELECT COALESCE(SUM(active_ms),0) AS active,COALESCE(SUM(completed_blocks),0) AS blocks FROM pomodoro_sessions WHERE user_id=? AND state IN ('COMPLETED','CANCELED')",
      [userId],
    )) as { active: string; blocks: string }[];
    return {
      activeSeconds: Math.floor(Number(rows[0]!.active) / 1000),
      completedBlocks: Number(rows[0]!.blocks),
    };
  }
  async completedCount(manager: EntityManager, userId: string) {
    const rows = await manager.query<Array<{ total: string }>>(
      "SELECT COUNT(*) total FROM pomodoro_sessions WHERE user_id=? AND state='COMPLETED'",
      [userId],
    );
    return Number(rows[0]!.total);
  }
}
