import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';

export interface AIUsage {
  reserve(userId: string, shared: boolean): Promise<() => Promise<void>>;
}
export class AIUsageRepository implements AIUsage {
  constructor(
    private readonly source: DataSource,
    private readonly env: ApiEnv,
    private readonly now: () => Date = () => new Date(),
  ) {}
  async reserve(userId: string, shared: boolean) {
    const id = randomUUID();
    await this.source.transaction(async (manager) => {
      // One short lock orders global and account reservations across every API process.
      await manager.query(
        'SELECT id FROM ai_usage_lock WHERE id = 1 FOR UPDATE',
      );
      const now = this.now();
      await manager.query('DELETE FROM ai_usage_leases WHERE expires_at <= ?', [
        now,
      ]);
      const leases = await manager.query<
        Array<{ user_id: string; shared: number }>
      >('SELECT user_id, shared FROM ai_usage_leases');
      const counters: Array<[string, string, number]> = [
        [
          `user:${userId}`,
          `minute:${now.toISOString().slice(0, 16)}`,
          this.env.AI_USER_REQUESTS_PER_MINUTE,
        ],
      ];
      if (shared)
        counters.push(
          [
            `user:${userId}`,
            `day:${now.toISOString().slice(0, 10)}`,
            this.env.AI_DEFAULT_USER_DAILY_LIMIT,
          ],
          [
            'global',
            `day:${now.toISOString().slice(0, 10)}`,
            this.env.AI_DEFAULT_GLOBAL_DAILY_LIMIT,
          ],
        );
      const limited = () =>
        new HttpError(
          429,
          'AI_LIMIT_REACHED',
          'Limite de IA atingido. Aguarde e tente novamente mais tarde.',
          60,
        );
      if (
        leases.filter((row) => row.user_id === userId).length >=
          this.env.AI_USER_MAX_CONCURRENCY ||
        (shared &&
          leases.filter((row) => row.shared).length >=
            this.env.AI_DEFAULT_GLOBAL_MAX_CONCURRENCY)
      )
        throw limited();
      for (const [scope, window, limit] of counters) {
        const rows = await manager.query<Array<{ calls: number }>>(
          'SELECT calls FROM ai_usage_counters WHERE scope = ? AND window_key = ?',
          [scope, window],
        );
        if ((rows[0]?.calls ?? 0) >= limit) throw limited();
      }
      for (const [scope, window] of counters)
        await manager.query(
          'INSERT INTO ai_usage_counters (scope, window_key, calls) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE calls = calls + 1',
          [scope, window],
        );
      await manager.query(
        'INSERT INTO ai_usage_leases (id, user_id, shared, expires_at) VALUES (?, ?, ?, ?)',
        [
          id,
          userId,
          shared,
          new Date(now.getTime() + this.env.AI_TIMEOUT_MS + 10000),
        ],
      );
      // Windows are only needed until the next UTC day. Keep bounded operational data.
      await manager.query(
        'DELETE FROM ai_usage_counters WHERE window_key < ? AND window_key LIKE ?',
        [`day:${now.toISOString().slice(0, 10)}`, 'day:%'],
      );
      await manager.query(
        'DELETE FROM ai_usage_counters WHERE window_key < ? AND window_key LIKE ?',
        [`minute:${now.toISOString().slice(0, 16)}`, 'minute:%'],
      );
    });
    return async () => {
      await this.source.query(
        'DELETE FROM ai_usage_leases WHERE id = ? AND user_id = ?',
        [id, userId],
      );
    };
  }
}
