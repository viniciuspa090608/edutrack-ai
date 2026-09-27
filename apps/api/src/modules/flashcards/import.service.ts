import {
  importConfirmSchema,
  mappingForColumns,
} from '@study-platform/contracts';
import type { ImportFormat } from '@study-platform/contracts';
import type { ImportRepository } from './import.repository.js';
import type { PreferencesService } from '../preferences/preferences.service.js';
import { HttpError } from '../../shared/http-error.js';
export class ImportService {
  constructor(
    private readonly repository: ImportRepository,
    private readonly prefs: Pick<PreferencesService, 'requireEnabled'>,
  ) {}
  upload(userId: string, deckId: string, format: ImportFormat, bytes: Buffer) {
    return this.repository.create(userId, deckId, format, bytes);
  }
  get(userId: string, deckId: string, attemptId: string) {
    return this.repository.get(userId, deckId, attemptId);
  }
  async preview(
    userId: string,
    deckId: string,
    attemptId: string,
    input: unknown,
  ) {
    const attempt = await this.get(userId, deckId, attemptId);
    if (attempt.state === 'completed')
      throw new HttpError(
        409,
        'IMPORT_COMPLETED',
        'Esta importação já foi concluída.',
      );
    const result = mappingForColumns(attempt.columns.length).safeParse(input);
    if (!result.success)
      throw new HttpError(
        400,
        'INVALID_IMPORT_MAPPING',
        'Selecione duas colunas distintas dentro do cabeçalho.',
      );
    return this.repository.preview(userId, deckId, attemptId, result.data);
  }
  async confirm(
    userId: string,
    deckId: string,
    attemptId: string,
    input: unknown,
  ) {
    await this.get(userId, deckId, attemptId);
    if (!importConfirmSchema.safeParse(input).success)
      throw new HttpError(
        400,
        'IMPORT_CONFIRMATION_REQUIRED',
        'Confirme a importação explicitamente.',
      );
    return this.repository.confirm(userId, deckId, attemptId, () =>
      this.prefs.requireEnabled(userId, 'flashcards'),
    );
  }
  async cancel(userId: string, deckId: string, attemptId: string) {
    await this.get(userId, deckId, attemptId);
    await this.repository.cancel(userId, deckId, attemptId);
  }
}
