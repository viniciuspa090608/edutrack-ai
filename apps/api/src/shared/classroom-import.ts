import type { EntityManager } from 'typeorm';
import type { ClassroomImportResult } from '@study-platform/contracts';

export interface ImportedRecord {
  id: string;
  local_id: string | null;
  snapshot: Record<string, unknown> | string;
  provenance: unknown;
  revision: number;
  conflict: unknown;
}
export function decode<T>(value: unknown): T {
  return typeof value === 'string' ? (JSON.parse(value) as T) : (value as T);
}
export async function importReceipt(
  m: EntityManager,
  kind: 'task' | 'subject',
  userId: string,
  receiptId: string,
) {
  const rows = await m.query<Array<{ result: ClassroomImportResult | string }>>(
    `SELECT result FROM ${kind}_classroom_receipts WHERE user_id=? AND receipt_id=?`,
    [userId, receiptId],
  );
  return rows[0] ? decode<ClassroomImportResult>(rows[0].result) : null;
}
export async function saveImportReceipt(
  m: EntityManager,
  kind: 'task' | 'subject',
  userId: string,
  receiptId: string,
  result: ClassroomImportResult,
) {
  await m.query(
    `INSERT INTO ${kind}_classroom_receipts(user_id,receipt_id,result) VALUES (?,?,?)`,
    [userId, receiptId, JSON.stringify(result)],
  );
  return result;
}
export async function importOrigin(
  m: EntityManager,
  kind: 'task' | 'subject',
  userId: string,
  googleSubject: string,
  courseId: string,
  itemId: string,
) {
  const rows = await m.query<ImportedRecord[]>(
    `SELECT * FROM ${kind}_classroom_sources WHERE user_id=? AND google_subject=? AND course_id=? AND item_id=? FOR UPDATE`,
    [userId, googleSubject, courseId, itemId],
  );
  return rows[0] ?? null;
}
export function importedMerge(
  local: Record<string, unknown>,
  previous: Record<string, unknown>,
  remote: Record<string, unknown>,
) {
  const updates: Record<string, unknown> = {},
    conflicts: Array<{
      field: string;
      local: string | null;
      remote: string | null;
    }> = [];
  for (const [field, value] of Object.entries(remote)) {
    if (JSON.stringify(local[field]) === JSON.stringify(value)) continue;
    if (JSON.stringify(local[field]) === JSON.stringify(previous[field]))
      updates[field] = value;
    else if (JSON.stringify(previous[field]) !== JSON.stringify(value))
      conflicts.push({
        field,
        local: local[field] == null ? null : String(local[field]),
        remote: value == null ? null : String(value),
      });
  }
  return { updates, conflicts };
}
export function importResult(
  localId: string | null,
  outcome: ClassroomImportResult['outcome'],
  reason: string | null = null,
): ClassroomImportResult {
  return { localId, outcome, reason, conflict: null };
}
export function nextImportSnapshot(
  previous: Record<string, unknown>,
  remote: Record<string, unknown>,
  conflicts: Array<{ field: string }>,
) {
  return {
    ...previous,
    ...remote,
    ...Object.fromEntries(
      conflicts.map((conflict) => [conflict.field, previous[conflict.field]]),
    ),
  };
}
