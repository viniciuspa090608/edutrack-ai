import { describe, expect, it } from 'vitest';
import {
  displayNameSchema,
  profileUpdateSchema,
  preferencesSchema,
  preferencesUpdateSchema,
  profileSchema,
  passwordChangeSchema,
  emailChangeSchema,
} from './index.js';
describe('profile contracts', () => {
  it('normalizes Unicode names and counts characters instead of UTF-16 units', () => {
    expect(displayNameSchema.parse('  A\u0301na  ')).toBe('Ána');
    expect(displayNameSchema.safeParse('😀'.repeat(60)).success).toBe(true);
    for (const name of ['', 'a', '\nAna', 'Ana\u0000', 'a'.repeat(61)])
      expect(displayNameSchema.safeParse(name).success).toBe(false);
    expect(
      profileUpdateSchema.safeParse({ displayName: 'Ana', id: 'someone' })
        .success,
    ).toBe(false);
  });
  it('validates strict partial preferences and sensitive changes', () => {
    expect(
      preferencesSchema.safeParse({
        tasks: false,
        subjects: false,
        flashcards: false,
        ai: true,
      }).success,
    ).toBe(false);
    expect(
      preferencesSchema.safeParse({
        tasks: true,
        subjects: false,
        flashcards: false,
        ai: false,
      }).success,
    ).toBe(true);
    expect(preferencesUpdateSchema.parse({ ai: true })).toEqual({ ai: true });
    for (const input of [
      {},
      { tasks: 'true' },
      { extra: false },
      { tasks: false, userId: 'other' },
    ])
      expect(preferencesUpdateSchema.safeParse(input).success).toBe(false);
    expect(preferencesSchema.safeParse({ tasks: true }).success).toBe(false);
    expect(
      emailChangeSchema.parse({ email: '  ANA@EXAMPLE.COM  ' }).email,
    ).toBe('ana@example.com');
    expect(
      passwordChangeSchema.safeParse({
        currentPassword: 'old',
        password: 'short',
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        id: '00000000-0000-4000-8000-000000000000',
        displayName: 'Ana',
        email: 'ana@example.com',
        emailVerified: true,
        googleLinked: false,
        localPassword: true,
        avatarVersion: null,
      }).success,
    ).toBe(true);
    expect(profileSchema.safeParse({ avatar_bytes: 'secret' }).success).toBe(
      false,
    );
  });
});
