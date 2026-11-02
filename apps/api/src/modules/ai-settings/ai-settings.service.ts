import {
  aiModels,
  aiSettingsSchema,
  aiSettingsWriteSchema,
  isAIModel,
} from '@study-platform/contracts';
import type {
  AICatalog,
  AISettings,
  AIProvider,
} from '@study-platform/contracts';
import type { ApiEnv } from '../../config/env.js';
import { HttpError } from '../../shared/http-error.js';
import { CredentialCrypto } from './credential-crypto.js';
import type {
  AISettingsRepository,
  SettingsRow,
} from './ai-settings.repository.js';

export interface AISnapshot {
  provider: AIProvider;
  model: string;
  credential: string;
  shared: boolean;
}
export interface AIResolver {
  resolve(userId: string): Promise<AISnapshot>;
}
const unavailable = () =>
  new HttpError(
    503,
    'AI_UNAVAILABLE',
    'A geração por IA está indisponível. Revise a configuração na conta.',
  );
export class AISettingsService implements AIResolver {
  private readonly crypto: CredentialCrypto;
  constructor(
    private readonly repository: AISettingsRepository,
    private readonly env: ApiEnv,
  ) {
    this.crypto = new CredentialCrypto(
      env.AI_CREDENTIAL_ENCRYPTION_KEY,
      env.AI_CREDENTIAL_KEY_VERSION,
    );
  }
  catalog(): AICatalog {
    const labels = {
      gemini: 'Gemini (Google)',
      claude: 'Claude (Anthropic)',
      openai: 'ChatGPT (API OpenAI)',
      deepseek: 'DeepSeek',
      kimi: 'Kimi (Moonshot)',
    };
    return {
      providers: (Object.keys(aiModels) as AIProvider[]).map((id) => ({
        id,
        label: labels[id],
        models: [...aiModels[id]],
      })),
      limits: {
        userPerMinute: this.env.AI_USER_REQUESTS_PER_MINUTE,
        userConcurrency: this.env.AI_USER_MAX_CONCURRENCY,
        platformUserDaily: this.env.AI_DEFAULT_USER_DAILY_LIMIT,
      },
    };
  }
  private dto(row?: SettingsRow): AISettings {
    const personal = row?.mode === 'personal';
    return aiSettingsSchema.parse({
      mode: personal ? 'personal' : 'platform',
      provider: personal ? row.provider : 'gemini',
      model: personal ? row.model : (this.env.GEMINI_MODEL ?? null),
      hasPersonalKey: personal && Boolean(row.ciphertext),
      platformAvailable: Boolean(
        this.env.GEMINI_API_KEY &&
        this.env.GEMINI_MODEL &&
        this.env.AI_RECEIPT_KEY,
      ),
      revision: row?.revision ?? 0,
    });
  }
  async read(userId: string) {
    return this.dto(await this.repository.read(userId));
  }
  async update(userId: string, input: unknown) {
    const parsed = aiSettingsWriteSchema.safeParse(input);
    if (!parsed.success)
      throw new HttpError(
        400,
        'INVALID_INPUT',
        'Revise provedor, modelo e chave da IA.',
      );
    return this.dto(
      await this.repository.update(userId, parsed.data, (provider, key) =>
        this.crypto.encrypt(userId, provider, key),
      ),
    );
  }
  async resolve(userId: string): Promise<AISnapshot> {
    if (!this.env.AI_RECEIPT_KEY) throw unavailable();
    const row = await this.repository.read(userId);
    if (row?.mode === 'personal') {
      if (
        !row.provider ||
        !row.model ||
        !row.ciphertext ||
        !row.nonce ||
        !row.tag ||
        !row.key_version ||
        !isAIModel(row.provider, row.model)
      )
        throw unavailable();
      try {
        return {
          provider: row.provider,
          model: row.model,
          credential: this.crypto.decrypt(userId, row.provider, {
            ciphertext: row.ciphertext,
            nonce: row.nonce,
            tag: row.tag,
            key_version: row.key_version,
          }),
          shared: false,
        };
      } catch {
        throw unavailable();
      }
    }
    if (
      !this.env.GEMINI_API_KEY ||
      !this.env.GEMINI_MODEL ||
      !isAIModel('gemini', this.env.GEMINI_MODEL)
    )
      throw unavailable();
    return {
      provider: 'gemini',
      model: this.env.GEMINI_MODEL,
      credential: this.env.GEMINI_API_KEY,
      shared: true,
    };
  }
}
