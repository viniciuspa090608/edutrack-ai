import { expect, it } from 'vitest';
import {
  importMappingSchema,
  mappingForColumns,
  importCountsSchema,
  importConfirmSchema,
  importAttemptSchema,
  importPreviewSchema,
} from './flashcard-import.js';
it('validates distinct indexed columns, available bounds and explicit confirmation', () => {
  expect(mappingForColumns(2).parse({ frontColumn: 1, backColumn: 0 })).toEqual(
    { frontColumn: 1, backColumn: 0 },
  );
  for (const value of [
    { frontColumn: 0, backColumn: 0 },
    { frontColumn: -1, backColumn: 1 },
    { frontColumn: 0.5, backColumn: 1 },
    { frontColumn: 0, backColumn: 100 },
    { frontColumn: 0, backColumn: 1, extra: true },
  ])
    expect(importMappingSchema.safeParse(value).success).toBe(false);
  expect(
    mappingForColumns(2).safeParse({ frontColumn: 0, backColumn: 2 }).success,
  ).toBe(false);
  expect(importConfirmSchema.safeParse({ confirm: false }).success).toBe(false);
});
it('checks counts and rejection reports and never exposes raw file bytes in DTOs', () => {
  const counts = { records: 3, imported: 1, ignored: 1, rejected: 1 };
  expect(importCountsSchema.parse(counts)).toEqual(counts);
  for (const value of [
    { ...counts, records: 2 },
    { ...counts, imported: -1 },
    { records: 1001, imported: 1001, ignored: 0, rejected: 0 },
  ])
    expect(importCountsSchema.safeParse(value).success).toBe(false);
  expect(
    importPreviewSchema.safeParse({
      mapping: { frontColumn: 0, backColumn: 1 },
      counts,
      sample: [],
      errors: [],
    }).success,
  ).toBe(false);
  const attempt = {
    id: '00000000-0000-4000-8000-000000000001',
    deckId: '00000000-0000-4000-8000-000000000002',
    expiresAt: '2026-09-27T00:00:00Z',
    state: 'uploaded',
    format: 'csv',
    columns: ['x', 'x'],
    records: 3,
  };
  expect(importAttemptSchema.safeParse(attempt).success).toBe(true);
  expect(
    importAttemptSchema.safeParse({ ...attempt, file_bytes: 'private' })
      .success,
  ).toBe(false);
});
