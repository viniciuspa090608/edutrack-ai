import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

export type EmailPurpose =
  'verify_email' | 'reset_password' | 'change_email' | 'email_changed';

export class EmailCrypto {
  private readonly hmacKey: Buffer;
  private readonly encryptionKey: Buffer;

  constructor(hmacKey: string, encryptionKey: string) {
    this.hmacKey = Buffer.from(hmacKey, 'hex');
    this.encryptionKey = Buffer.from(encryptionKey, 'hex');
    if (this.hmacKey.length !== 32 || this.encryptionKey.length !== 32)
      throw new Error('Invalid email keys');
  }

  code(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
  token(): string {
    return randomBytes(32).toString('base64url');
  }
  id(): string {
    return randomUUID();
  }
  digest(domain: string, value: string): Buffer {
    return createHmac('sha256', this.hmacKey)
      .update(domain)
      .update('\0')
      .update(value)
      .digest();
  }
  matches(expected: Buffer, domain: string, value: string): boolean {
    const received = this.digest(domain, value);
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }
  encrypt(value: object): { ciphertext: Buffer; nonce: Buffer; tag: Buffer } {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, nonce);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    return { ciphertext, nonce, tag: cipher.getAuthTag() };
  }
  decrypt<T>(ciphertext: Buffer, nonce: Buffer, tag: Buffer): T {
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, nonce);
    decipher.setAuthTag(tag);
    return JSON.parse(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        'utf8',
      ),
    ) as T;
  }
}
