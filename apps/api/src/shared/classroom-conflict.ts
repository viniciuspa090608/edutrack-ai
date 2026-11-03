import type { EntityManager } from 'typeorm';
import { classroomConflictSchema } from '@study-platform/contracts';
import { HttpError } from './http-error.js';
import { decode } from './classroom-import.js';

export async function resolveClassroomConflict(
  manager: EntityManager,
  kind: 'task' | 'subject',
  userId: string,
  id: string,
  revision: number,
  choice: 'keep_local' | 'accept_remote',
  read: (id: string) => Promise<Record<string, unknown>>,
  write: (id: string, fields: Record<string, unknown>) => Promise<void>,
) {
  const rows = await manager.query<
    Array<{
      local_id: string | null;
      revision: number;
      conflict: unknown;
      snapshot: unknown;
    }>
  >(
    `SELECT local_id,revision,conflict,snapshot FROM ${kind}_classroom_sources WHERE user_id=? AND id=? FOR UPDATE`,
    [userId, id],
  );
  const row = rows[0];
  if (!row?.local_id || !row.conflict)
    throw new HttpError(
      404,
      'CLASSROOM_CONFLICT_NOT_FOUND',
      'Conflito não encontrado.',
    );
  if (row.revision !== revision)
    throw new HttpError(
      409,
      'CLASSROOM_CONFLICT_CHANGED',
      'O conflito mudou. Recarregue antes de confirmar.',
    );
  const conflict = classroomConflictSchema.parse(decode(row.conflict));
  const local = await read(row.local_id);
  if (
    conflict.fields.some(
      (field) => String(local[field.field] ?? '') !== String(field.local ?? ''),
    )
  )
    throw new HttpError(
      409,
      'CLASSROOM_CONFLICT_CHANGED',
      'O registro foi editado. Importe novamente para revisar o conflito atualizado.',
    );
  if (choice === 'accept_remote')
    await write(
      row.local_id,
      Object.fromEntries(
        conflict.fields.map((field) => [field.field, field.remote]),
      ),
    );
  await manager.query(
    `UPDATE ${kind}_classroom_sources SET conflict=NULL,snapshot=?,revision=revision+1 WHERE user_id=? AND id=?`,
    [
      JSON.stringify({
        ...decode<Record<string, unknown>>(row.snapshot),
        ...Object.fromEntries(
          conflict.fields.map((field) => [field.field, field.remote]),
        ),
      }),
      userId,
      id,
    ],
  );
}
