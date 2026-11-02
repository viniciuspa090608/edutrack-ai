import type { DataSource, EntityManager } from 'typeorm';
import type { AIProvider, AISettingsWrite } from '@study-platform/contracts';
import type { EncryptedCredential } from './credential-crypto.js';
import { HttpError } from '../../shared/http-error.js';

export interface SettingsRow {
  mode: 'platform' | 'personal';
  provider: AIProvider | null;
  model: string | null;
  revision: number;
  ciphertext: Buffer | null;
  nonce: Buffer | null;
  tag: Buffer | null;
  key_version: string | null;
}
export class AISettingsRepository {
  constructor(private readonly source: DataSource) {}
  async read(
    userId: string,
    manager?: EntityManager,
  ): Promise<SettingsRow | undefined> {
    return (
      await (manager ?? this.source).query<SettingsRow[]>(
        'SELECT mode, provider, model, revision, ciphertext, nonce, tag, key_version FROM user_ai_settings WHERE user_id = ?',
        [userId],
      )
    )[0];
  }
  async update(
    userId: string,
    input: AISettingsWrite,
    encrypt: (provider: AIProvider, secret: string) => EncryptedCredential,
  ): Promise<SettingsRow> {
    return this.source.transaction(async (manager) => {
      // Lock the account even for its first settings write; an absent row cannot be locked safely.
      const users = await manager.query<unknown[]>(
        'SELECT id FROM users WHERE id = ? FOR UPDATE',
        [userId],
      );
      if (!users.length)
        throw new HttpError(404, 'ACCOUNT_NOT_FOUND', 'Conta indisponível.');
      const current = await this.read(userId, manager);
      if ((current?.revision ?? 0) !== input.revision)
        throw new HttpError(
          409,
          'AI_SETTINGS_CONFLICT',
          'A configuração mudou. Recarregue antes de salvar.',
        );
      let secret: EncryptedCredential | undefined;
      if (input.mode === 'personal') {
        if (input.apiKey !== undefined)
          secret = encrypt(input.provider, input.apiKey);
        else if (
          current?.mode === 'personal' &&
          current.provider === input.provider &&
          current.ciphertext &&
          current.nonce &&
          current.tag &&
          current.key_version
        )
          secret = {
            ciphertext: current.ciphertext,
            nonce: current.nonce,
            tag: current.tag,
            key_version: current.key_version,
          };
        else
          throw new HttpError(
            400,
            'AI_KEY_REQUIRED',
            'Informe uma nova chave para este provedor.',
          );
      }
      await manager.query(
        `INSERT INTO user_ai_settings (user_id, mode, provider, model, ciphertext, nonce, tag, key_version, revision)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE mode=VALUES(mode), provider=VALUES(provider), model=VALUES(model), ciphertext=VALUES(ciphertext), nonce=VALUES(nonce), tag=VALUES(tag), key_version=VALUES(key_version), revision=VALUES(revision)`,
        [
          userId,
          input.mode,
          input.mode === 'personal' ? input.provider : null,
          input.mode === 'personal' ? input.model : null,
          secret?.ciphertext ?? null,
          secret?.nonce ?? null,
          secret?.tag ?? null,
          secret?.key_version ?? null,
          input.revision + 1,
        ],
      );
      return (await this.read(userId, manager))!;
    });
  }
}
