import {
  importAttemptSchema,
  importUploadSchema,
  importMappingSchema,
  importConfirmSchema,
  importMaxBytes,
  deckSchema,
} from '@study-platform/contracts';
import type { ImportFormat, ImportMapping } from '@study-platform/contracts';
import { send } from '../auth/auth-api.js';
const path = (deckId: string, attemptId?: string) =>
  `/decks/${deckSchema.shape.id.parse(deckId)}/imports${attemptId ? `/${deckSchema.shape.id.parse(attemptId)}` : ''}`;
export async function uploadImport(
  deckId: string,
  file: File,
  format: ImportFormat,
) {
  importUploadSchema.parse({ format });
  if (file.size > importMaxBytes)
    throw new Error('O arquivo deve ter no máximo 2 MiB.');
  return importAttemptSchema.parse(
    await (
      await send(`${path(deckId)}?format=${format}`, {
        method: 'POST',
        headers: {
          'Content-Type':
            format === 'csv' ? 'text/csv' : 'text/tab-separated-values',
        },
        body: file,
      })
    ).json(),
  );
}
export async function getImport(deckId: string, attemptId: string) {
  return importAttemptSchema.parse(
    await (await send(path(deckId, attemptId))).json(),
  );
}
async function write(
  deckId: string,
  attemptId: string,
  suffix: string,
  method: string,
  body: object,
) {
  return send(`${path(deckId, attemptId)}${suffix}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
export async function previewImport(
  deckId: string,
  attemptId: string,
  mapping: ImportMapping,
) {
  return importAttemptSchema.parse(
    await (
      await write(
        deckId,
        attemptId,
        '/preview',
        'PUT',
        importMappingSchema.parse(mapping),
      )
    ).json(),
  );
}
export async function confirmImport(deckId: string, attemptId: string) {
  return importAttemptSchema.parse(
    await (
      await write(
        deckId,
        attemptId,
        '/confirm',
        'POST',
        importConfirmSchema.parse({ confirm: true }),
      )
    ).json(),
  );
}
export async function cancelImport(deckId: string, attemptId: string) {
  await write(deckId, attemptId, '', 'DELETE', {});
}
