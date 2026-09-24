import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';

const HASH_LENGTH = 64;
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024,
} as const;
const DUMMY_SALT = Buffer.alloc(32, 91);
const DUMMY_HASH = Buffer.alloc(HASH_LENGTH, 17);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validPassword(password: string): boolean {
  return password.length >= 12 && password.length <= 128;
}

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      HASH_LENGTH,
      SCRYPT_OPTIONS,
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

export async function hashPassword(
  password: string,
): Promise<{ hash: Buffer; salt: Buffer }> {
  if (!validPassword(password)) throw new Error('Invalid password length');
  const salt = randomBytes(32);
  return { hash: await derive(password, salt), salt };
}

export async function verifyPassword(
  password: string,
  stored: { hash: Buffer; salt: Buffer; version: number } | null,
): Promise<boolean> {
  const salt = stored?.salt ?? DUMMY_SALT;
  const expected = stored?.hash ?? DUMMY_HASH;
  const actual = await derive(password, salt);
  return (
    stored?.version === 1 &&
    expected.length === actual.length &&
    timingSafeEqual(expected, actual)
  );
}
