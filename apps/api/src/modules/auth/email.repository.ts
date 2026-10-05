import type { DataSource, EntityManager } from 'typeorm';
import { HttpError } from '../../shared/http-error.js';
import {
  EmailCrypto,
  type EmailPurpose,
  type EmailPresentation,
} from './email-crypto.js';
import { secretHash } from './session.repository.js';

const invalidCode = () =>
  new HttpError(400, 'INVALID_CODE', 'Código inválido ou expirado.');

interface ChallengeRow {
  id: string;
  user_id: string;
  code_hmac: Buffer;
  attempts: number;
  state: string;
  valid: number;
}
interface ContextRow {
  user_id: string;
}
interface RateRow {
  attempts: number;
  wait_seconds: number;
  window_seconds: number;
}
interface OutboxRow {
  id: string;
  challenge_id: string;
  purpose: EmailPurpose;
  ciphertext: Buffer;
  nonce: Buffer;
  auth_tag: Buffer;
  attempts: number;
  challenge_state: string;
  lease_token: string;
}

export class EmailRepository {
  constructor(
    readonly source: DataSource,
    readonly crypto: EmailCrypto,
  ) {}

  async limitValidation(purpose: EmailPurpose, ip: string): Promise<void> {
    await this.source.transaction((manager) =>
      this.rate(manager, `${purpose}:validation:ip`, ip, 100),
    );
  }

  private async rate(
    manager: EntityManager,
    kind: string,
    value: string,
    max: number,
    interval = false,
  ): Promise<void> {
    const key = this.crypto.digest(`rate:${kind}`, value);
    await manager.query(
      `INSERT INTO email_rate_limits (rate_key, attempts, window_end, last_issued_at)
      VALUES (?, 0, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 1 HOUR), DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 HOUR))
      ON DUPLICATE KEY UPDATE attempts = IF(window_end <= UTC_TIMESTAMP(3), 0, attempts),
      last_issued_at = IF(window_end <= UTC_TIMESTAMP(3), DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 HOUR), last_issued_at),
      window_end = IF(window_end <= UTC_TIMESTAMP(3), DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 1 HOUR), window_end)`,
      [key],
    );
    const rows = await manager.query<RateRow[]>(
      `SELECT attempts,
      GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(3), DATE_ADD(last_issued_at, INTERVAL 60 SECOND))) AS wait_seconds,
      GREATEST(1, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(3), window_end)) AS window_seconds
      FROM email_rate_limits WHERE rate_key = ? FOR UPDATE`,
      [key],
    );
    const row = rows[0]!;
    if (row.attempts >= max || (interval && row.wait_seconds > 0))
      throw new HttpError(
        429,
        'EMAIL_RATE_LIMITED',
        'Aguarde antes de solicitar outro código.',
        row.attempts >= max ? row.window_seconds : row.wait_seconds,
      );
    await manager.query(
      'UPDATE email_rate_limits SET attempts = attempts + 1, last_issued_at = UTC_TIMESTAMP(3) WHERE rate_key = ?',
      [key],
    );
  }

  async issue(
    userId: string | null,
    email: string,
    purpose: EmailPurpose,
    ip: string,
    transaction?: EntityManager,
    presentation: EmailPresentation = {},
  ): Promise<boolean> {
    const persist = async (manager: EntityManager): Promise<boolean> => {
      await this.rate(manager, `${purpose}:email`, email, 3, true);
      await this.rate(manager, `${purpose}:ip`, ip, 30);
      if (!userId) return false;
      if (purpose === 'change_email')
        await this.rate(manager, 'change_email:user', userId, 3, true);
      const users = await manager.query<
        Array<{ email_verified_at: Date | null; display_name: string }>
      >(
        'SELECT email_verified_at, display_name FROM users WHERE id = ? FOR UPDATE',
        [userId],
      );
      if (purpose === 'verify_email' && users[0]?.email_verified_at)
        throw new HttpError(
          409,
          'ALREADY_VERIFIED',
          'Este e-mail já foi confirmado.',
        );
      const previous = await manager.query<
        Array<{ id: string; code_hmac: Buffer }>
      >(
        'SELECT id, code_hmac FROM email_challenges WHERE user_id = ? AND purpose = ? AND created_at > DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 HOUR)',
        [userId, purpose],
      );
      await manager.query(
        `UPDATE email_challenges SET state = 'revoked', active_marker = NULL
        WHERE user_id = ? AND purpose = ? AND active_marker = 1`,
        [userId, purpose],
      );
      if (purpose === 'reset_password')
        await manager.query(
          'UPDATE reset_grants SET consumed_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND consumed_at IS NULL',
          [userId],
        );
      const id = this.crypto.id();
      let code = this.crypto.code();
      while (
        previous.some((challenge) =>
          this.crypto.matches(
            challenge.code_hmac,
            `code:${challenge.id}`,
            code,
          ),
        )
      )
        code = this.crypto.code();
      const payload = this.crypto.encrypt({
        email,
        code,
        purpose,
        presentation: { ...presentation, displayName: users[0]?.display_name },
      });
      await manager.query(
        `INSERT INTO email_challenges (id, user_id, purpose, code_hmac, state, active_marker)
        VALUES (?, ?, ?, ?, 'queued', 1)`,
        [id, userId, purpose, this.crypto.digest(`code:${id}`, code)],
      );
      await manager.query(
        `INSERT INTO email_outbox (id, challenge_id, ciphertext, nonce, auth_tag, state)
        VALUES (?, ?, ?, ?, ?, 'queued')`,
        [this.crypto.id(), id, payload.ciphertext, payload.nonce, payload.tag],
      );
      return true;
    };
    return transaction
      ? persist(transaction)
      : this.source.transaction(persist);
  }

  async context(userId: string, transaction?: EntityManager): Promise<string> {
    const token = this.crypto.token();
    await (transaction ?? this.source).query(
      `INSERT INTO verification_contexts (id, user_id, token_hash, expires_at)
      VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 15 MINUTE))`,
      [this.crypto.id(), userId, secretHash(token)],
    );
    return token;
  }

  async notifyChanged(
    manager: EntityManager,
    userId: string,
    email: string,
    newEmail?: string,
  ): Promise<void> {
    const id = this.crypto.id();
    const users = await manager.query<Array<{ display_name: string }>>(
      'SELECT display_name FROM users WHERE id = ?',
      [userId],
    );
    const payload = this.crypto.encrypt({
      email,
      code: '',
      purpose: 'email_changed',
      presentation: { displayName: users[0]?.display_name, newEmail },
    });
    await manager.query(
      `INSERT INTO email_challenges (id, user_id, purpose, code_hmac, state)
      VALUES (?, ?, 'email_changed', ?, 'queued')`,
      [id, userId, this.crypto.digest(`code:${id}`, '')],
    );
    await manager.query(
      `INSERT INTO email_outbox (id, challenge_id, ciphertext, nonce, auth_tag, state)
      VALUES (?, ?, ?, ?, ?, 'queued')`,
      [this.crypto.id(), id, payload.ciphertext, payload.nonce, payload.tag],
    );
  }

  async contextUser(token: string): Promise<string | null> {
    const rows = await this.source.query<ContextRow[]>(
      `SELECT user_id FROM verification_contexts
      WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP(3) LIMIT 1`,
      [secretHash(token)],
    );
    return rows[0]?.user_id ?? null;
  }

  async consume(
    userId: string,
    purpose: EmailPurpose,
    code: string,
    onConfirmed?: (manager: EntityManager) => Promise<void>,
  ): Promise<string | null> {
    return this.source
      .transaction(async (manager) => {
        await manager.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [
          userId,
        ]);
        const rows = await manager.query<ChallengeRow[]>(
          `SELECT id, user_id, code_hmac, attempts, state,
        (expires_at IS NOT NULL AND expires_at > UTC_TIMESTAMP(3)) AS valid
        FROM email_challenges WHERE user_id = ? AND purpose = ? AND active_marker = 1 FOR UPDATE`,
          [userId, purpose],
        );
        const row = rows[0];
        if (!row || row.state !== 'sent' || Number(row.valid) !== 1)
          throw invalidCode();
        if (row.attempts >= 5) throw invalidCode();
        if (!this.crypto.matches(row.code_hmac, `code:${row.id}`, code)) {
          const attempts = row.attempts + 1;
          await manager.query(
            `UPDATE email_challenges SET attempts = ?,
          state = IF(? >= 5, 'blocked', state), active_marker = IF(? >= 5, NULL, active_marker)
          WHERE id = ?`,
            [attempts, attempts, attempts, row.id],
          );
          return 'invalid';
        }
        await manager.query(
          `UPDATE email_challenges SET state = 'consumed', active_marker = NULL,
        consumed_at = UTC_TIMESTAMP(3) WHERE id = ?`,
          [row.id],
        );
        if (purpose === 'change_email') {
          if (!onConfirmed) throw invalidCode();
          await onConfirmed(manager);
          return null;
        }
        if (purpose === 'verify_email') {
          await manager.query(
            'UPDATE users SET email_verified_at = UTC_TIMESTAMP(3) WHERE id = ? AND email_verified_at IS NULL',
            [userId],
          );
          await manager.query(
            'UPDATE verification_contexts SET consumed_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND consumed_at IS NULL',
            [userId],
          );
          return null;
        }
        const grant = this.crypto.token();
        await manager.query(
          `INSERT INTO reset_grants (id, user_id, token_hash, expires_at)
        VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 5 MINUTE))`,
          [this.crypto.id(), userId, secretHash(grant)],
        );
        return grant;
      })
      .then((result) => {
        if (result === 'invalid') throw invalidCode();
        return result;
      });
  }

  async reset(token: string, hash: Buffer, salt: Buffer): Promise<void> {
    const used = await this.source.transaction(async (manager) => {
      const candidates = await manager.query<ContextRow[]>(
        'SELECT user_id FROM reset_grants WHERE token_hash = ?',
        [secretHash(token)],
      );
      const userId = candidates[0]?.user_id;
      if (!userId) return false;
      await manager.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [
        userId,
      ]);
      const rows = await manager.query<ContextRow[]>(
        `SELECT user_id FROM reset_grants WHERE token_hash = ?
        AND consumed_at IS NULL AND expires_at > UTC_TIMESTAMP(3) FOR UPDATE`,
        [secretHash(token)],
      );
      if (!rows[0]) return false;
      await manager.query(
        'UPDATE password_credentials SET password_hash = ?, salt = ?, hash_version = 1 WHERE user_id = ?',
        [hash, salt, userId],
      );
      await manager.query(
        'UPDATE users SET email_verified_at = COALESCE(email_verified_at, UTC_TIMESTAMP(3)) WHERE id = ?',
        [userId],
      );
      await manager.query(
        'UPDATE reset_grants SET consumed_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND consumed_at IS NULL',
        [userId],
      );
      await manager.query(
        `UPDATE email_challenges SET state = 'revoked', active_marker = NULL
        WHERE user_id = ? AND active_marker = 1`,
        [userId],
      );
      await manager.query(
        'UPDATE verification_contexts SET consumed_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND consumed_at IS NULL',
        [userId],
      );
      await manager.query(
        'UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND revoked_at IS NULL',
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
      return true;
    });
    if (!used)
      throw new HttpError(
        401,
        'INVALID_RESET_GRANT',
        'Solicite um novo código.',
      );
  }

  async reserve(): Promise<OutboxRow | null> {
    return this.source.transaction(async (manager) => {
      const rows = await manager.query<
        OutboxRow[]
      >(`SELECT o.id, o.challenge_id, c.purpose, o.ciphertext, o.nonce, o.auth_tag,
        o.attempts, c.state AS challenge_state FROM email_outbox o JOIN email_challenges c ON c.id = o.challenge_id
        WHERE (o.state = 'queued' AND o.available_at <= UTC_TIMESTAMP(3))
          OR (o.state = 'leased' AND o.lease_until <= UTC_TIMESTAMP(3))
        ORDER BY o.available_at LIMIT 1 FOR UPDATE SKIP LOCKED`);
      const row = rows[0];
      if (!row) return null;
      if (row.purpose === 'change_email') {
        const reservations = await manager.query<Array<{ user_id: string }>>(
          `SELECT r.user_id FROM email_change_reservations r JOIN email_challenges c ON c.user_id = r.user_id
          WHERE c.id = ? AND r.expires_at > UTC_TIMESTAMP(3)`,
          [row.challenge_id],
        );
        if (!reservations[0]) {
          await manager.query(
            "UPDATE email_challenges SET state = 'revoked', active_marker = NULL WHERE id = ? AND state = 'queued'",
            [row.challenge_id],
          );
          row.challenge_state = 'revoked';
        }
      }
      const leaseToken = this.crypto.id();
      await manager.query(
        `UPDATE email_outbox SET state = 'leased', lease_until = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 2 MINUTE),
        lease_token = ?, attempts = attempts + 1 WHERE id = ?`,
        [leaseToken, row.id],
      );
      row.attempts += 1;
      row.lease_token = leaseToken;
      return row;
    });
  }

  async finishDelivery(row: OutboxRow, delivered: boolean): Promise<void> {
    await this.source.transaction(async (manager) => {
      const leases = await manager.query<Array<{ id: string }>>(
        "SELECT id FROM email_outbox WHERE id = ? AND state = 'leased' AND lease_token = ? FOR UPDATE",
        [row.id, row.lease_token],
      );
      if (!leases[0]) return;
      const rows = await manager.query<Array<{ state: string }>>(
        'SELECT state FROM email_challenges WHERE id = ? FOR UPDATE',
        [row.challenge_id],
      );
      if (rows[0]?.state !== 'queued') delivered = false;
      if (delivered) {
        await manager.query(
          `UPDATE email_challenges SET state = 'sent', delivered_at = UTC_TIMESTAMP(3),
          expires_at = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL 10 MINUTE) WHERE id = ?`,
          [row.challenge_id],
        );
        if (row.purpose === 'change_email')
          await manager.query(
            `UPDATE email_change_reservations r JOIN email_challenges c ON c.user_id = r.user_id
            SET r.expires_at = c.expires_at WHERE c.id = ?`,
            [row.challenge_id],
          );
        await manager.query(
          `UPDATE email_outbox SET state = 'sent', ciphertext = NULL, nonce = NULL,
          auth_tag = NULL, lease_until = NULL, lease_token = NULL, delivered_at = UTC_TIMESTAMP(3) WHERE id = ?`,
          [row.id],
        );
      } else if (rows[0]?.state !== 'queued' || row.attempts >= 5) {
        await manager.query(
          `UPDATE email_outbox SET state = 'discarded', ciphertext = NULL, nonce = NULL,
          auth_tag = NULL, lease_until = NULL, lease_token = NULL WHERE id = ?`,
          [row.id],
        );
        await manager.query(
          `UPDATE email_challenges SET state = 'revoked', active_marker = NULL
          WHERE id = ? AND state = 'queued'`,
          [row.challenge_id],
        );
      } else {
        await manager.query(
          `UPDATE email_outbox SET state = 'queued', lease_until = NULL, lease_token = NULL,
          available_at = DATE_ADD(UTC_TIMESTAMP(3), INTERVAL ? SECOND) WHERE id = ?`,
          [Math.min(300, 2 ** row.attempts * 5), row.id],
        );
      }
    });
  }

  async deliverOne(
    send: (
      email: string,
      code: string,
      purpose: EmailPurpose,
      presentation?: EmailPresentation,
    ) => Promise<void>,
    report?: (
      event: 'email.sent' | 'email.discarded' | 'email.delivery_failed',
    ) => void,
  ): Promise<boolean> {
    const row = await this.reserve();
    if (!row) return false;
    if (row.challenge_state !== 'queued') {
      await this.finishDelivery(row, false);
      report?.('email.discarded');
      return true;
    }
    try {
      const payload = this.crypto.decrypt<{
        email: string;
        code: string;
        purpose: EmailPurpose;
        presentation?: EmailPresentation;
      }>(row.ciphertext, row.nonce, row.auth_tag);
      const presentation = payload.presentation ?? {};
      if (
        !presentation.displayName ||
        (payload.purpose === 'email_changed' && !presentation.newEmail)
      ) {
        const users = await this.source.query<
          Array<{ display_name: string; email: string }>
        >(
          'SELECT u.display_name, u.email FROM users u JOIN email_challenges c ON c.user_id = u.id WHERE c.id = ?',
          [row.challenge_id],
        );
        presentation.displayName ||= users[0]?.display_name ?? 'Estudante';
        if (payload.purpose === 'email_changed')
          presentation.newEmail ||= users[0]?.email;
      }
      await send(payload.email, payload.code, payload.purpose, presentation);
      await this.finishDelivery(row, true);
      report?.('email.sent');
    } catch {
      await this.finishDelivery(row, false);
      report?.('email.delivery_failed');
    }
    return true;
  }
}
