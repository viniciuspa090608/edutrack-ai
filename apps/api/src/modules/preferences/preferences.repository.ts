import type { Capability, ModulePreferences } from '@study-platform/contracts';
import { hasEnabledStudyModule } from '@study-platform/contracts';
import type { DataSource, EntityManager } from 'typeorm';
import { HttpError } from '../../shared/http-error.js';
const columns = {
  tasks: 'tasks_enabled',
  subjects: 'subjects_enabled',
  flashcards: 'flashcards_enabled',
  ai: 'ai_enabled',
} as const;
export class PreferencesRepository {
  constructor(private readonly source: DataSource) {}
  async read(
    userId: string,
    transaction?: EntityManager,
  ): Promise<ModulePreferences> {
    const rows = await (transaction ?? this.source).query<
      Array<Record<string, number>>
    >(
      `SELECT tasks_enabled, subjects_enabled, flashcards_enabled, ai_enabled FROM user_preferences WHERE user_id = ?${transaction ? ' FOR UPDATE' : ''}`,
      [userId],
    );
    if (!rows[0])
      throw new HttpError(
        503,
        'PREFERENCES_MISSING',
        'Preferências indisponíveis. Tente novamente.',
      );
    return Object.fromEntries(
      Object.entries(columns).map(([key, column]) => [
        key,
        Boolean(rows[0]![column]),
      ]),
    ) as ModulePreferences;
  }
  async update(
    userId: string,
    values: { [K in Capability]?: boolean | undefined },
  ): Promise<ModulePreferences> {
    const keys = (Object.keys(values) as Capability[]).filter(
      (k) => values[k] !== undefined,
    );
    if (!keys.length)
      throw new HttpError(400, 'INVALID_INPUT', 'Informe uma preferência.');
    return this.source.transaction(async (manager) => {
      const current = await this.read(userId, manager);
      const next = { ...current };
      for (const key of keys) next[key] = values[key]!;
      if (!hasEnabledStudyModule(next))
        throw new HttpError(
          409,
          'LAST_MODULE_REQUIRED',
          'Mantenha pelo menos um módulo de estudo ativo: tarefas, matérias ou flashcards.',
        );
      await manager.query(
        `UPDATE user_preferences SET ${keys.map((k) => `${columns[k]} = ?`).join(', ')} WHERE user_id = ?`,
        [...keys.map((k) => values[k]), userId],
      );
      return next;
    });
  }
}
