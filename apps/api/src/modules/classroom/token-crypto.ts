import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export class ClassroomTokenCrypto {
  constructor(private readonly key: string) {}
  encrypt(userId: string, value: unknown): string {
    const nonce = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.key, 'hex'),
      nonce,
    );
    cipher.setAAD(Buffer.from(`edutrack-classroom-v1:${userId}`));
    const bytes = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final(),
    ]);
    return [nonce, cipher.getAuthTag(), bytes]
      .map((part) => part.toString('base64url'))
      .join('.');
  }
  decrypt(userId: string, value: string): unknown {
    const parts = value
      .split('.')
      .map((part) => Buffer.from(part, 'base64url'));
    if (parts.length !== 3) throw new Error('Classroom credential unavailable');
    const cipher = createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.key, 'hex'),
      parts[0]!,
    );
    cipher.setAAD(Buffer.from(`edutrack-classroom-v1:${userId}`));
    cipher.setAuthTag(parts[1]!);
    return JSON.parse(
      Buffer.concat([cipher.update(parts[2]!), cipher.final()]).toString(
        'utf8',
      ),
    ) as unknown;
  }
}
