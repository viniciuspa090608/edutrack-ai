import { describe, expect, it } from 'vitest';
import {
  calendarDateSchema,
  createTaskSchema,
  taskFiltersSchema,
  updateTaskSchema,
} from './tasks.js';

describe('study task contracts', () => {
  it('trims titles, defaults fields and accepts explicit clearing', () => {
    expect(createTaskSchema.parse({ title: '  Revisar  ' })).toEqual({
      title: 'Revisar',
      description: null,
      dueDate: null,
      priority: 'MEDIUM',
      status: 'PENDING',
    });
    expect(
      updateTaskSchema.parse({ description: null, dueDate: null }),
    ).toEqual({ description: null, dueDate: null });
    expect(
      createTaskSchema.safeParse({
        title: 'a'.repeat(160),
        description: 'a'.repeat(2000),
      }).success,
    ).toBe(true);
  });
  it('rejects invalid text, enums, unknown fields and empty patches', () => {
    for (const input of [
      { title: ' ' },
      { title: 'a'.repeat(161) },
      { title: 'a', description: 'a'.repeat(2001) },
      { title: 'a', status: 'DONE' },
      { title: 'a', priority: 'URGENT' },
      { title: 'a', userId: 'foreign' },
      { title: null },
    ])
      expect(createTaskSchema.safeParse(input).success).toBe(false);
    for (const input of [
      {},
      { title: undefined },
      { description: undefined },
      { id: 'foreign' },
      { priority: null },
    ])
      expect(updateTaskSchema.safeParse(input).success).toBe(false);
  });
  it('keeps real calendar dates including leap days and past dates', () => {
    for (const date of ['2024-02-29', '2000-01-01', '9999-12-31'])
      expect(calendarDateSchema.parse(date)).toBe(date);
    for (const date of [
      '2025-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-1-01',
      '0000-01-01',
      '2026-01-01T00:00:00Z',
    ])
      expect(calendarDateSchema.safeParse(date).success).toBe(false);
  });
  it('validates combined inclusive ranges and pagination', () => {
    expect(taskFiltersSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(
      taskFiltersSchema.parse({
        page: '2',
        pageSize: '100',
        dueFrom: '2026-01-01',
        dueTo: '2026-01-01',
      }).page,
    ).toBe(2);
    for (const input of [
      { page: '0' },
      { page: '' },
      { page: [] },
      { pageSize: 101 },
      { page: '1.1' },
      { page: '9007199254740992' },
      { dueFrom: '2026-02-01', dueTo: '2026-01-01' },
      { status: 'bad' },
      { priority: 'bad' },
      { userId: 'foreign' },
    ])
      expect(taskFiltersSchema.safeParse(input).success).toBe(false);
  });
});
