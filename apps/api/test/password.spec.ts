import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  normalizeEmail,
  validPassword,
  verifyPassword,
} from '../src/modules/auth/password.js';

describe('local credentials', () => {
  it('normalizes only the email', async () => {
    expect(normalizeEmail('  Name@Example.COM ')).toBe('name@example.com');
    expect(validPassword('  abcdefghij  ')).toBe(true);
    expect(validPassword('short')).toBe(false);
    const credential = await hashPassword('  abcdefghij  ');
    expect(credential.hash.toString()).not.toContain('abcdefghij');
    expect(
      await verifyPassword('  abcdefghij  ', { ...credential, version: 1 }),
    ).toBe(true);
    expect(
      await verifyPassword('abcdefghij    ', { ...credential, version: 1 }),
    ).toBe(false);
    expect(await verifyPassword('  abcdefghij  ', null)).toBe(false);
  });

  it('uses fresh salt for each credential', async () => {
    const a = await hashPassword('correct-horse-battery');
    const b = await hashPassword('correct-horse-battery');
    expect(a.salt.equals(b.salt)).toBe(false);
    expect(a.hash.equals(b.hash)).toBe(false);
  });
});
