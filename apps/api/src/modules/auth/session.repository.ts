import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';

export interface ActiveSession {
  id: string;
  userId: string;
}
interface SessionRow {
  id: string;
  user_id: string;
}

export function secretHash(secret: string): Buffer {
  return createHash('sha256').update(secret).digest();
}

export class SessionRepository {
  constructor(private readonly source: DataSource) {}

  async create(userId: string, previousToken?: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    await this.source.transaction(async (manager) => {
      if (previousToken) {
        await manager.query(
          'UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE token_hash = ? AND revoked_at IS NULL',
          [secretHash(previousToken)],
        );
      }
      await manager.query(
        `INSERT INTO sessions (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 7 DAY))`,
        [randomUUID(), userId, secretHash(token)],
      );
    });
    return token;
  }

  async resolve(token: string): Promise<ActiveSession | null> {
    const rows = await this.source.query<SessionRow[]>(
      `SELECT id, user_id FROM sessions WHERE token_hash = ? AND revoked_at IS NULL
       AND expires_at > UTC_TIMESTAMP(3)
       AND last_used_at > DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 24 HOUR) LIMIT 1`,
      [secretHash(token)],
    );
    const row = rows[0];
    if (!row) return null;
    await this.source.query(
      'UPDATE sessions SET last_used_at = UTC_TIMESTAMP(3) WHERE id = ? AND revoked_at IS NULL',
      [row.id],
    );
    return { id: row.id, userId: row.user_id };
  }

  async revoke(token: string): Promise<void> {
    await this.source.query(
      'UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE token_hash = ? AND revoked_at IS NULL',
      [secretHash(token)],
    );
  }

  async cleanup(): Promise<void> {
    await this.source.query(
      `DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP(3)
       OR (revoked_at IS NOT NULL AND revoked_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 7 DAY))
       OR last_used_at < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 8 DAY) LIMIT 100`,
    );
  }
}
