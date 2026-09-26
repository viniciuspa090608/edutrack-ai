import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import { lockAvailableEmail } from './profile.repository.js';

export interface AuthUser {
  id: string;
  email: string;
}
export interface PasswordRecord {
  userId: string;
  hash: Buffer;
  salt: Buffer;
  version: number;
}

interface UserRow {
  id: string;
  email: string;
}
interface PasswordRow {
  user_id: string;
  password_hash: Buffer;
  salt: Buffer;
  hash_version: number;
}
interface IdentityRow {
  user_id: string;
}

export class AuthRepository {
  constructor(readonly source: DataSource) {}

  async userById(id: string): Promise<AuthUser | null> {
    const rows = await this.source.query<UserRow[]>(
      'SELECT id, email FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] ?? null;
  }

  async isEmailVerified(userId: string): Promise<boolean> {
    const rows = await this.source.query<Array<{ verified: number }>>(
      'SELECT (email_verified_at IS NOT NULL) AS verified FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    return Number(rows[0]?.verified) === 1;
  }

  async userByEmail(email: string): Promise<AuthUser | null> {
    const rows = await this.source.query<UserRow[]>(
      'SELECT id, email FROM users WHERE email = ? LIMIT 1',
      [email],
    );
    return rows[0] ?? null;
  }

  async passwordByEmail(email: string): Promise<PasswordRecord | null> {
    const rows = await this.source.query<PasswordRow[]>(
      `SELECT p.user_id, p.password_hash, p.salt, p.hash_version
       FROM password_credentials p JOIN users u ON u.id = p.user_id
       WHERE u.email = ? LIMIT 1`,
      [email],
    );
    const row = rows[0];
    return row
      ? {
          userId: row.user_id,
          hash: row.password_hash,
          salt: row.salt,
          version: row.hash_version,
        }
      : null;
  }

  async createLocal(
    email: string,
    hash: Buffer,
    salt: Buffer,
    transaction?: EntityManager,
  ): Promise<AuthUser> {
    const id = randomUUID();
    const persist = async (manager: EntityManager) => {
      await lockAvailableEmail(manager, email);
      await manager.query('INSERT INTO users (id, email) VALUES (?, ?)', [
        id,
        email,
      ]);
      await manager.query('INSERT INTO user_preferences (user_id) VALUES (?)', [
        id,
      ]);
      await manager.query(
        'INSERT INTO password_credentials (user_id, password_hash, salt, hash_version) VALUES (?, ?, ?, 1)',
        [id, hash, salt],
      );
    };
    if (transaction) await persist(transaction);
    else await this.source.transaction(persist);
    return { id, email };
  }

  async googleUser(subject: string): Promise<AuthUser | null> {
    const rows = await this.source.query<UserRow[]>(
      `SELECT u.id, u.email FROM users u JOIN external_identities i ON i.user_id = u.id
       WHERE i.provider = 'google' AND i.subject = ? LIMIT 1`,
      [subject],
    );
    return rows[0] ?? null;
  }

  async hasGoogle(userId: string): Promise<boolean> {
    const rows = await this.source.query<IdentityRow[]>(
      `SELECT user_id FROM external_identities WHERE user_id = ? AND provider = 'google' LIMIT 1`,
      [userId],
    );
    return rows.length > 0;
  }

  async createGoogle(
    email: string,
    subject: string,
    providerEmail: string,
  ): Promise<AuthUser> {
    const id = randomUUID();
    await this.source.transaction(async (manager) => {
      await lockAvailableEmail(manager, email);
      await manager.query(
        'INSERT INTO users (id, email, email_verified_at) VALUES (?, ?, UTC_TIMESTAMP(3))',
        [id, email],
      );
      await manager.query('INSERT INTO user_preferences (user_id) VALUES (?)', [
        id,
      ]);
      await manager.query(
        `INSERT INTO external_identities (id, user_id, provider, subject, provider_email)
         VALUES (?, ?, 'google', ?, ?)`,
        [randomUUID(), id, subject, providerEmail],
      );
    });
    return { id, email };
  }

  async linkGoogle(
    userId: string,
    subject: string,
    providerEmail: string,
  ): Promise<void> {
    await this.source.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO external_identities (id, user_id, provider, subject, provider_email)
         VALUES (?, ?, 'google', ?, ?)`,
        [randomUUID(), userId, subject, providerEmail],
      );
    });
  }
}

export function isDuplicateKey(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ('code' in error && error.code === 'ER_DUP_ENTRY') return true;
  return 'driverError' in error && isDuplicateKey(error.driverError);
}
