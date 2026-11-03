import { randomUUID } from 'node:crypto';
import type { DataSource, EntityManager } from 'typeorm';
import type {
  Capability,
  ClassroomConnection,
} from '@study-platform/contracts';
import { classroomConnectionSchema } from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
import { permissions } from './scopes.js';
import type { PreferencesService } from '../preferences/preferences.service.js';

export interface ClassroomConnectionRow {
  user_id: string;
  google_subject: string | null;
  email: string | null;
  state: ClassroomConnection['state'];
  version: number;
  scopes: string[] | string;
  encrypted_tokens: string | null;
}
export function json<T>(value: T | string): T {
  return typeof value === 'string' ? (JSON.parse(value) as T) : value;
}
export class ClassroomRepository {
  constructor(
    readonly source: DataSource,
    private readonly preferences: Pick<PreferencesService, 'readLocked'>,
  ) {}
  async connection(
    userId: string,
    manager: EntityManager = this.source.manager,
    lock = false,
  ) {
    if (lock)
      await manager.query(
        `INSERT IGNORE INTO classroom_connections (user_id,scopes) VALUES (?,JSON_ARRAY())`,
        [userId],
      );
    const rows = await manager.query<ClassroomConnectionRow[]>(
      `SELECT * FROM classroom_connections WHERE user_id=?${lock ? ' FOR UPDATE' : ''}`,
      [userId],
    );
    return rows[0] ?? null;
  }
  async status(
    userId: string,
    available: boolean,
  ): Promise<ClassroomConnection> {
    const row = await this.connection(userId);
    return classroomConnectionSchema.parse({
      available,
      state: row?.state ?? 'disconnected',
      account:
        row?.google_subject && row.email
          ? { subject: row.google_subject, email: row.email }
          : null,
      permissions: permissions(row ? json<string[]>(row.scopes) : []),
      version: row?.version ?? 0,
    });
  }
  // Public execution boundary. Producers receive the same transaction, but retain
  // ownership of their own persistence and never import another module's repository.
  async allowed<T>(
    userId: string,
    version: number,
    capabilities: Capability[],
    work: (
      manager: EntityManager,
      connection: ClassroomConnectionRow,
    ) => Promise<T>,
  ): Promise<T> {
    return this.source.transaction(async (manager) => {
      const prefs = await this.preferences.readLocked(manager, userId);
      for (const capability of capabilities)
        if (!prefs[capability])
          throw new HttpError(
            403,
            'MODULE_DISABLED',
            'O recurso foi desativado nas preferências.',
          );
      const connection = await this.connection(userId, manager, true);
      if (
        !connection ||
        connection.state !== 'connected' ||
        connection.version !== version
      )
        throw new HttpError(
          409,
          'CLASSROOM_CONNECTION_CHANGED',
          'A conexão mudou. Reconecte e tente novamente.',
        );
      return work(manager, connection);
    });
  }
  async disconnect(userId: string) {
    return this.source.transaction(async (manager) => {
      const row = await this.connection(userId, manager, true);
      await manager.query(
        "UPDATE classroom_connections SET state='disconnected',encrypted_tokens=NULL,scopes=JSON_ARRAY(),version=version+1 WHERE user_id=?",
        [userId],
      );
      await manager.query(
        "UPDATE classroom_operations SET state='cancelled',phase='finished',active_marker=NULL,message='Integração desconectada.',lease_owner=NULL,lease_until=NULL WHERE user_id=? AND active_marker=1",
        [userId],
      );
      return row?.encrypted_tokens ?? null;
    });
  }
  async attempt(
    userId: string,
    sessionId: string,
    stateHash: Buffer,
    browserHash: Buffer,
    verifier: string,
    nonce: string,
    purpose: string,
  ) {
    const row = await this.connection(userId);
    await this.source.query(
      'DELETE FROM classroom_oauth_attempts WHERE expires_at<UTC_TIMESTAMP(3)',
      [],
    );
    await this.source.query(
      `INSERT INTO classroom_oauth_attempts (id,user_id,session_id,state_hash,browser_hash,verifier,nonce,purpose,connection_version,expires_at) VALUES (?,?,?,?,?,?,?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 10 MINUTE))`,
      [
        randomUUID(),
        userId,
        sessionId,
        stateHash,
        browserHash,
        verifier,
        nonce,
        purpose,
        row?.version ?? 0,
      ],
    );
  }
  consume(userId: string, sessionId: string, state: Buffer, browser: Buffer) {
    return this.source.transaction(async (manager) => {
      const rows = await manager.query<
        Array<{
          id: string;
          verifier: string;
          nonce: string;
          purpose: string;
          connection_version: number;
        }>
      >(
        'SELECT * FROM classroom_oauth_attempts WHERE user_id=? AND session_id=? AND state_hash=? AND browser_hash=? AND consumed_at IS NULL AND expires_at>UTC_TIMESTAMP(3) FOR UPDATE',
        [userId, sessionId, state, browser],
      );
      if (!rows[0])
        throw new HttpError(
          400,
          'CLASSROOM_OAUTH_FAILED',
          'Autorização inválida ou expirada. Tente conectar novamente.',
        );
      await manager.query(
        'UPDATE classroom_oauth_attempts SET consumed_at=UTC_TIMESTAMP(3) WHERE id=? AND user_id=?',
        [rows[0].id, userId],
      );
      return rows[0];
    });
  }
  saveConnection(
    userId: string,
    version: number,
    subject: string,
    email: string,
    scopes: string[],
    encrypted: string,
  ) {
    return this.source.transaction(async (manager) => {
      const previous = await this.connection(userId, manager, true);
      if (previous!.version !== version)
        throw new HttpError(
          409,
          'CLASSROOM_CONNECTION_CHANGED',
          'A conexão mudou. Tente novamente.',
        );
      await manager.query(
        "UPDATE classroom_connections SET google_subject=?,email=?,scopes=?,encrypted_tokens=?,state='connected',version=version+1 WHERE user_id=?",
        [subject, email, JSON.stringify(scopes), encrypted, userId],
      );
      await manager.query(
        "UPDATE classroom_operations SET state='cancelled',phase='finished',active_marker=NULL,message='Conexão substituída.' WHERE user_id=? AND active_marker=1",
        [userId],
      );
      if (previous!.google_subject !== subject)
        await manager.query(
          'DELETE FROM classroom_selections WHERE user_id=?',
          [userId],
        );
    });
  }
}
