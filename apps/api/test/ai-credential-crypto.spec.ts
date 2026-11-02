import { expect, it } from 'vitest';
import { CredentialCrypto } from '../src/modules/ai-settings/credential-crypto.js';
it('binds independent nonces, authentication and key version to account and provider', () => {
  const crypto = new CredentialCrypto('e'.repeat(64), 'v1');
  const secret = 'SYNTHETIC_CREDENTIAL_CANARY';
  const first = crypto.encrypt('account-1', 'gemini', secret);
  const second = crypto.encrypt('account-1', 'gemini', secret);
  expect(first.nonce).not.toEqual(second.nonce);
  expect(first.ciphertext.toString()).not.toContain(secret);
  expect(crypto.decrypt('account-1', 'gemini', first)).toBe(secret);
  expect(() => crypto.decrypt('account-2', 'gemini', first)).toThrow();
  expect(() => crypto.decrypt('account-1', 'openai', first)).toThrow();
  const damaged = Buffer.from(first.ciphertext);
  damaged[0] = damaged[0]! ^ 1;
  expect(() =>
    crypto.decrypt('account-1', 'gemini', { ...first, ciphertext: damaged }),
  ).toThrow();
  expect(() =>
    new CredentialCrypto('e'.repeat(64), 'v2').decrypt(
      'account-1',
      'gemini',
      first,
    ),
  ).toThrow();
});
