import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import { secretHash } from './session.repository.js';

export interface OAuthAttempt {
  id: string;
  codeVerifier: string;
  nonce: string;
  intent: 'login' | 'link' | 'reauth';
  userId: string | null;
  sessionId: string | null;
  returnTo: string;
}

interface AttemptRow {
  id: string;
  code_verifier: string;
  nonce: string;
  intent: 'login' | 'link' | 'reauth';
  user_id: string | null;
  session_id: string | null;
  return_to: string;
}

export class OAuthRepository {
  constructor(private readonly source: DataSource) {}

  async create(
    input: OAuthAttempt,
    state: string,
    browserSecret: string,
  ): Promise<void> {
    await this.source.query(
      `INSERT INTO oauth_attempts
       (id, state_hash, browser_hash, code_verifier, nonce, intent, user_id, session_id, return_to, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 10 MINUTE))`,
      [
        input.id || randomUUID(),
        secretHash(state),
        secretHash(browserSecret),
        input.codeVerifier,
        input.nonce,
        input.intent,
        input.userId,
        input.sessionId,
        input.returnTo,
      ],
    );
  }

  async consume(
    state: string,
    browserSecret: string,
  ): Promise<OAuthAttempt | null> {
    return this.source.transaction(async (manager) => {
      const update = (await manager.query(
        `UPDATE oauth_attempts SET consumed_at = UTC_TIMESTAMP(3)
         WHERE state_hash = ? AND browser_hash = ? AND consumed_at IS NULL
           AND expires_at > UTC_TIMESTAMP(3)`,
        [secretHash(state), secretHash(browserSecret)],
      )) as { affectedRows: number };
      if (update.affectedRows !== 1) return null;
      const rows = (await manager.query(
        `SELECT id, code_verifier, nonce, intent, user_id, session_id, return_to
         FROM oauth_attempts WHERE state_hash = ? LIMIT 1`,
        [secretHash(state)],
      )) as AttemptRow[];
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        codeVerifier: row.code_verifier,
        nonce: row.nonce,
        intent: row.intent,
        userId: row.user_id,
        sessionId: row.session_id,
        returnTo: row.return_to,
      };
    });
  }

  async cleanup(): Promise<void> {
    await this.source.query(
      'DELETE FROM oauth_attempts WHERE expires_at <= UTC_TIMESTAMP(3) LIMIT 100',
    );
  }
}
