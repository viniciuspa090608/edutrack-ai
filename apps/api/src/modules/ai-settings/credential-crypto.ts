import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { AIProvider } from '@study-platform/contracts';

export interface EncryptedCredential {
  ciphertext: Buffer;
  nonce: Buffer;
  tag: Buffer;
  key_version: string;
}
export class CredentialCrypto {
  private readonly key: Buffer;
  constructor(
    key: string,
    private readonly version: string,
  ) {
    this.key = Buffer.from(key, 'hex');
  }
  private aad(userId: string, provider: AIProvider, version: string) {
    return Buffer.from(
      JSON.stringify(['edutrack-ai', userId, provider, version]),
    );
  }
  encrypt(
    userId: string,
    provider: AIProvider,
    secret: string,
  ): EncryptedCredential {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, nonce);
    cipher.setAAD(this.aad(userId, provider, this.version));
    return {
      ciphertext: Buffer.concat([
        cipher.update(secret, 'utf8'),
        cipher.final(),
      ]),
      nonce,
      tag: cipher.getAuthTag(),
      key_version: this.version,
    };
  }
  decrypt(
    userId: string,
    provider: AIProvider,
    value: EncryptedCredential,
  ): string {
    if (value.key_version !== this.version)
      throw new Error('Credential version unavailable');
    const cipher = createDecipheriv('aes-256-gcm', this.key, value.nonce);
    cipher.setAAD(this.aad(userId, provider, value.key_version));
    cipher.setAuthTag(value.tag);
    return Buffer.concat([
      cipher.update(value.ciphertext),
      cipher.final(),
    ]).toString('utf8');
  }
}
