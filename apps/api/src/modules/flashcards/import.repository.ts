import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import {
  importAttemptSchema,
  importPreviewSchema,
  importResultSchema,
} from '@study-platform/contracts';
import type {
  ImportFormat,
  ImportMapping,
  ImportPreview,
  ImportResult,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { parseImport, classifyImport } from './import-parser.js';
interface AttemptRow {
  id: string;
  deck_id: string;
  format: ImportFormat;
  state: 'uploaded' | 'preview' | 'completed';
  file_bytes: Buffer | null;
  preview: ImportPreview | string | null;
  result: ImportResult | string | null;
  expires_at: Date;
}
const json = (value: unknown) =>
  typeof value === 'string' ? (JSON.parse(value) as unknown) : value;
const missing = () =>
  new HttpError(
    404,
    'IMPORT_NOT_FOUND',
    'Baralho ou tentativa não encontrado.',
  );
function dto(row: AttemptRow) {
  const common = {
    id: row.id,
    deckId: row.deck_id,
    expiresAt: row.expires_at.toISOString(),
  };
  if (row.state === 'completed')
    return importAttemptSchema.parse({
      ...common,
      state: row.state,
      result: json(row.result),
    });
  const parsed = parseImport(row.file_bytes!, row.format);
  return importAttemptSchema.parse({
    ...common,
    state: row.state,
    format: row.format,
    columns: parsed.columns,
    records: parsed.records.length,
    ...(row.state === 'preview' ? { preview: json(row.preview) } : {}),
  });
}
export class ImportRepository {
  constructor(private readonly source: DataSource) {}
  async cleanupExpired() {
    await this.source.query(
      'DELETE FROM flashcard_import_attempts WHERE expires_at<=UTC_TIMESTAMP(3)',
    );
  }
  private async deck(
    manager: EntityManager,
    userId: string,
    deckId: string,
    lock = false,
  ) {
    const rows = await manager.query<{ id: string }[]>(
      `SELECT id FROM flashcard_decks WHERE user_id=? AND id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId, deckId],
    );
    if (!rows[0]) throw missing();
  }
  private async row(
    manager: EntityManager,
    userId: string,
    deckId: string,
    attemptId: string,
    lock = false,
  ) {
    const rows = await manager.query<AttemptRow[]>(
      `SELECT a.* FROM flashcard_import_attempts a JOIN flashcard_decks d ON d.id=a.deck_id AND d.user_id=a.user_id WHERE a.user_id=? AND a.deck_id=? AND a.id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId, deckId, attemptId],
    );
    if (!rows[0]) throw missing();
    return rows[0];
  }
  private requireActive(row: AttemptRow) {
    if (row.expires_at.getTime() <= Date.now())
      throw new HttpError(
        410,
        'IMPORT_EXPIRED',
        'A tentativa expirou. Envie o arquivo novamente.',
      );
  }
  async get(userId: string, deckId: string, attemptId: string) {
    const row = await this.row(this.source.manager, userId, deckId, attemptId);
    if (row.expires_at.getTime() <= Date.now()) {
      await this.source.query(
        'DELETE FROM flashcard_import_attempts WHERE user_id=? AND deck_id=? AND id=? AND expires_at<=UTC_TIMESTAMP(3)',
        [userId, deckId, attemptId],
      );
      this.requireActive(row);
    }
    return dto(row);
  }
  async create(
    userId: string,
    deckId: string,
    format: ImportFormat,
    bytes: Buffer,
  ) {
    await this.deck(this.source.manager, userId, deckId);
    parseImport(bytes, format);
    return this.source.transaction(async (manager) => {
      await this.deck(manager, userId, deckId, true);
      const id = randomUUID();
      await manager.query(
        'INSERT INTO flashcard_import_attempts (id,user_id,deck_id,format,file_bytes,expires_at) VALUES (?,?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 15 MINUTE))',
        [id, userId, deckId, format, bytes],
      );
      return dto(await this.row(manager, userId, deckId, id));
    });
  }
  private existing(manager: EntityManager, userId: string, deckId: string) {
    return manager.query<Array<{ front: string; back: string }>>(
      'SELECT c.front,c.back FROM flashcards c JOIN flashcard_decks d ON d.id=c.deck_id WHERE d.user_id=? AND d.id=?',
      [userId, deckId],
    );
  }
  preview(
    userId: string,
    deckId: string,
    attemptId: string,
    mapping: ImportMapping,
  ) {
    return this.source.transaction(async (manager) => {
      await this.deck(manager, userId, deckId, true);
      const row = await this.row(manager, userId, deckId, attemptId, true);
      this.requireActive(row);
      if (row.state === 'completed')
        throw new HttpError(
          409,
          'IMPORT_COMPLETED',
          'Esta importação já foi concluída.',
        );
      const { preview } = classifyImport(
        parseImport(row.file_bytes!, row.format),
        mapping,
        await this.existing(manager, userId, deckId),
      );
      importPreviewSchema.parse(preview);
      await manager.query(
        "UPDATE flashcard_import_attempts SET state='preview',preview=? WHERE user_id=? AND deck_id=? AND id=?",
        [JSON.stringify(preview), userId, deckId, attemptId],
      );
      return dto(await this.row(manager, userId, deckId, attemptId));
    });
  }
  confirm(
    userId: string,
    deckId: string,
    attemptId: string,
    recheckPreference: () => Promise<void>,
  ) {
    return this.source.transaction(async (manager) => {
      // Manual card mutations use this same deck lock, including edits/deletes.
      await this.deck(manager, userId, deckId, true);
      const row = await this.row(manager, userId, deckId, attemptId, true);
      this.requireActive(row);
      await recheckPreference();
      if (row.state === 'completed') return dto(row);
      if (row.state !== 'preview')
        throw new HttpError(
          409,
          'IMPORT_PREVIEW_REQUIRED',
          'Confira a prévia antes de confirmar.',
        );
      const snapshot = importPreviewSchema.parse(json(row.preview));
      const classified = classifyImport(
        parseImport(row.file_bytes!, row.format),
        snapshot.mapping,
        await this.existing(manager, userId, deckId),
      );
      // Bounded batches keep packets small even with 1,000 maximum-sized cards.
      for (let offset = 0; offset < classified.cards.length; offset += 50) {
        const batch = classified.cards.slice(offset, offset + 50);
        await manager.query(
          `INSERT INTO flashcards (id,deck_id,front,back) VALUES ${batch.map(() => '(?,?,?,?)').join(',')}`,
          batch.flatMap((card) => [
            randomUUID(),
            deckId,
            card.front,
            card.back,
          ]),
        );
      }
      const result = importResultSchema.parse({
        counts: classified.preview.counts,
        errors: classified.preview.errors,
      });
      await manager.query(
        "UPDATE flashcard_import_attempts SET state='completed',result=?,file_bytes=NULL,preview=NULL,expires_at=DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 24 HOUR) WHERE user_id=? AND deck_id=? AND id=?",
        [JSON.stringify(result), userId, deckId, attemptId],
      );
      return dto(await this.row(manager, userId, deckId, attemptId));
    });
  }
  async cancel(userId: string, deckId: string, attemptId: string) {
    await this.source.transaction(async (manager) => {
      await this.deck(manager, userId, deckId, true);
      const row = await this.row(manager, userId, deckId, attemptId, true);
      this.requireActive(row);
      if (row.state === 'completed')
        throw new HttpError(
          409,
          'IMPORT_COMPLETED',
          'Esta importação já foi concluída. Consulte o resultado.',
        );
      await manager.query(
        'DELETE FROM flashcard_import_attempts WHERE user_id=? AND deck_id=? AND id=?',
        [userId, deckId, attemptId],
      );
    });
  }
}
