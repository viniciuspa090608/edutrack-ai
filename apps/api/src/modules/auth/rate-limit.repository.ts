import { createHash } from 'node:crypto';
import type { DataSource } from 'typeorm';

interface CounterRow {
  attempts: number;
}

export class RateLimitRepository {
  constructor(private readonly source: DataSource) {}

  private key(action: string, scope: string, value: string): Buffer {
    return createHash('sha256').update(`${action}:${scope}:${value}`).digest();
  }

  async blocked(
    action: string,
    scope: string,
    value: string,
    limit: number,
  ): Promise<boolean> {
    const rows = await this.source.query<CounterRow[]>(
      `SELECT attempts FROM auth_rate_limits WHERE rate_key = ?
       AND window_end > UTC_TIMESTAMP(3) LIMIT 1`,
      [this.key(action, scope, value)],
    );
    return (rows[0]?.attempts ?? 0) >= limit;
  }

  async record(action: string, scope: string, value: string): Promise<void> {
    await this.source.query(
      `INSERT INTO auth_rate_limits (rate_key, attempts, window_end)
       VALUES (?, 1, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 15 MINUTE))
       ON DUPLICATE KEY UPDATE
         attempts = IF(window_end <= UTC_TIMESTAMP(3), 1, attempts + 1),
         window_end = IF(window_end <= UTC_TIMESTAMP(3), DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 15 MINUTE), window_end)`,
      [this.key(action, scope, value)],
    );
  }

  async cleanup(): Promise<void> {
    await this.source.query(
      'DELETE FROM auth_rate_limits WHERE window_end <= UTC_TIMESTAMP(3) LIMIT 100',
    );
  }
}
