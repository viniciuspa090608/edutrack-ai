import type { UserProfile } from '@study-platform/contracts';
import type { DataSource, EntityManager } from 'typeorm';
import { HttpError } from '../../shared/http-error.js';
import type { ActiveSession } from './session.repository.js';

export async function lockAvailableEmail(
  manager: EntityManager,
  email: string,
  userId?: string,
): Promise<void> {
  await manager.query(
    'INSERT IGNORE INTO email_address_locks (email) VALUES (?)',
    [email],
  );
  await manager.query(
    'SELECT email FROM email_address_locks WHERE email = ? FOR UPDATE',
    [email],
  );
  await manager.query(
    'DELETE FROM email_change_reservations WHERE email = ? AND expires_at <= UTC_TIMESTAMP(3)',
    [email],
  );
  const rows = await manager.query<Array<{ id: string }>>(
    `SELECT id FROM users WHERE email = ? AND id <> ? UNION ALL
     SELECT user_id AS id FROM email_change_reservations WHERE email = ? AND user_id <> ?`,
    [email, userId ?? '', email, userId ?? ''],
  );
  if (rows.length)
    throw new HttpError(
      409,
      'EMAIL_UNAVAILABLE',
      'Não foi possível usar este e-mail.',
    );
}

export class ProfileRepository {
  constructor(readonly source: DataSource) {}
  async lockUser(manager: EntityManager, userId: string): Promise<void> {
    await manager.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [
      userId,
    ]);
  }
  async requireActiveSession(
    manager: EntityManager,
    session: ActiveSession,
  ): Promise<void> {
    const rows = await manager.query<Array<{ id: string }>>(
      `SELECT id FROM sessions WHERE id = ? AND user_id = ? AND revoked_at IS NULL
      AND expires_at > UTC_TIMESTAMP(3) AND last_used_at > DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 24 HOUR) FOR UPDATE`,
      [session.id, session.userId],
    );
    if (!rows[0])
      throw new HttpError(
        401,
        'UNAUTHENTICATED',
        'Entre novamente para continuar.',
      );
  }
  async matchesPassword(
    manager: EntityManager,
    userId: string,
    expected: Buffer,
  ): Promise<boolean> {
    const rows = await manager.query<Array<{ password_hash: Buffer }>>(
      'SELECT password_hash FROM password_credentials WHERE user_id = ?',
      [userId],
    );
    return rows[0]?.password_hash.equals(expected) ?? false;
  }
  async currentEmail(manager: EntityManager, userId: string): Promise<string> {
    const rows = await manager.query<Array<{ email: string }>>(
      'SELECT email FROM users WHERE id = ?',
      [userId],
    );
    return rows[0]!.email;
  }
  async reserveEmail(
    manager: EntityManager,
    userId: string,
    email: string,
  ): Promise<void> {
    await manager.query(
      `INSERT INTO email_change_reservations (user_id, email, expires_at)
      VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 15 MINUTE))
      ON DUPLICATE KEY UPDATE email = VALUES(email), expires_at = VALUES(expires_at)`,
      [userId, email],
    );
  }
  async reservation(manager: EntityManager, userId: string): Promise<string> {
    const rows = await manager.query<Array<{ email: string }>>(
      'SELECT email FROM email_change_reservations WHERE user_id = ? AND expires_at > UTC_TIMESTAMP(3) FOR UPDATE',
      [userId],
    );
    if (!rows[0])
      throw new HttpError(
        400,
        'INVALID_CODE',
        'Solicite uma nova alteração de e-mail.',
      );
    return rows[0].email;
  }
  async consumeProof(manager: EntityManager, sessionId: string): Promise<void> {
    await manager.query('DELETE FROM identity_proofs WHERE session_id = ?', [
      sessionId,
    ]);
  }
  async setEmail(
    manager: EntityManager,
    userId: string,
    email: string,
  ): Promise<void> {
    await manager.query(
      'UPDATE users SET email = ?, email_verified_at = UTC_TIMESTAMP(3) WHERE id = ?',
      [email, userId],
    );
  }
  async setPassword(
    manager: EntityManager,
    userId: string,
    expected: Buffer,
    next: { hash: Buffer; salt: Buffer },
  ): Promise<void> {
    const result = await manager.query<{ affectedRows: number }>(
      'UPDATE password_credentials SET password_hash = ?, salt = ?, hash_version = 1 WHERE user_id = ? AND password_hash = ?',
      [next.hash, next.salt, userId, expected],
    );
    if (result.affectedRows !== 1)
      throw new HttpError(
        401,
        'INVALID_CREDENTIALS',
        'Confirme sua identidade novamente.',
      );
  }
  async read(userId: string): Promise<UserProfile> {
    const rows = await this.source.query<
      Array<{
        id: string;
        email: string;
        display_name: string;
        verified: number;
        local_password: number;
        google_linked: number;
        avatar_updated_at: Date | null;
      }>
    >(
      `SELECT u.id, u.email, u.display_name, (u.email_verified_at IS NOT NULL) AS verified, u.avatar_updated_at,
      EXISTS(SELECT 1 FROM password_credentials p WHERE p.user_id = u.id) AS local_password,
      EXISTS(SELECT 1 FROM external_identities i WHERE i.user_id = u.id AND i.provider = 'google') AS google_linked
      FROM users u WHERE u.id = ?`,
      [userId],
    );
    const row = rows[0];
    if (!row)
      throw new HttpError(401, 'UNAUTHENTICATED', 'Entre para continuar.');
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      emailVerified: Boolean(row.verified),
      localPassword: Boolean(row.local_password),
      googleLinked: Boolean(row.google_linked),
      avatarVersion: row.avatar_updated_at?.toISOString() ?? null,
    };
  }
  async name(userId: string, name: string): Promise<void> {
    await this.source.query('UPDATE users SET display_name = ? WHERE id = ?', [
      name,
      userId,
    ]);
  }
  async avatar(userId: string): Promise<Buffer | null> {
    const rows = await this.source.query<
      Array<{ avatar_bytes: Buffer | null }>
    >('SELECT avatar_bytes FROM users WHERE id = ?', [userId]);
    return rows[0]?.avatar_bytes ?? null;
  }
  async saveAvatar(userId: string, bytes: Buffer | null): Promise<void> {
    await this.source.query(
      `UPDATE users SET avatar_bytes = ?, avatar_mime = ?, avatar_updated_at = ? WHERE id = ?`,
      [bytes, bytes ? 'image/webp' : null, bytes ? new Date() : null, userId],
    );
  }
  async prove(session: ActiveSession, manager?: EntityManager): Promise<void> {
    await (manager ?? this.source).query(
      `INSERT INTO identity_proofs (session_id, expires_at)
      VALUES (?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 5 MINUTE))
      ON DUPLICATE KEY UPDATE expires_at = VALUES(expires_at)`,
      [session.id],
    );
  }
  async requireProof(
    session: ActiveSession,
    manager: EntityManager,
  ): Promise<void> {
    const rows = await manager.query<Array<{ session_id: string }>>(
      `SELECT p.session_id FROM identity_proofs p JOIN sessions s ON s.id = p.session_id
      WHERE p.session_id = ? AND s.user_id = ? AND s.revoked_at IS NULL AND s.expires_at > UTC_TIMESTAMP(3)
      AND s.last_used_at > DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 24 HOUR) AND p.expires_at > UTC_TIMESTAMP(3) FOR UPDATE`,
      [session.id, session.userId],
    );
    if (!rows[0])
      throw new HttpError(
        401,
        'IDENTITY_PROOF_REQUIRED',
        'Confirme novamente sua identidade.',
      );
  }
  async invalidate(manager: EntityManager, userId: string): Promise<void> {
    await manager.query(
      'UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND revoked_at IS NULL',
      [userId],
    );
    await manager.query(
      'UPDATE reset_grants SET consumed_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND consumed_at IS NULL',
      [userId],
    );
    await manager.query(
      "UPDATE email_challenges SET state = 'revoked', active_marker = NULL WHERE user_id = ? AND active_marker = 1",
      [userId],
    );
    await manager.query(
      'UPDATE verification_contexts SET consumed_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND consumed_at IS NULL',
      [userId],
    );
    await manager.query(
      'DELETE FROM email_change_reservations WHERE user_id = ?',
      [userId],
    );
    await manager.query(
      'DELETE p FROM identity_proofs p JOIN sessions s ON s.id = p.session_id WHERE s.user_id = ?',
      [userId],
    );
  }
}
