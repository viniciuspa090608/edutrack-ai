import { describe, expect, it } from 'vitest';
import {
  createRoutineSchema,
  updateRoutineSchema,
  routineSchema,
  routinePaginationSchema,
} from './routines.js';
const slot = { weekday: 1, startTime: '08:00', endTime: '09:00' };
const routine = {
  name: ' Estudar ',
  timeZone: 'America/Sao_Paulo',
  slots: [slot],
};
describe('routine boundary contracts', () => {
  it('rejects invalid names, time zones, unknown fields and missing slots', () => {
    for (const input of [
      { ...routine, name: '' },
      { ...routine, name: ' '.repeat(3) },
      { ...routine, name: 'x'.repeat(121) },
      { ...routine, timeZone: 'Invalid/Zone' },
      { ...routine, timeZone: '+03:00' },
      { ...routine, slots: [] },
      { name: 'Nome', timeZone: 'UTC' },
      { ...routine, userId: 'x' },
    ])
      expect(createRoutineSchema.safeParse(input).success).toBe(false);
    expect(createRoutineSchema.parse(routine).name).toBe('Estudar');
    expect(updateRoutineSchema.safeParse({}).success).toBe(false);
    expect(updateRoutineSchema.safeParse({ timeZone: 'UTC' }).success).toBe(
      true,
    );
    expect(routinePaginationSchema.safeParse({ userId: 'x' }).success).toBe(
      false,
    );
  });
  it('enforces local same-day intervals and ISO weekdays', () => {
    for (const change of [
      { weekday: 0 },
      { weekday: 8 },
      { weekday: 1.5 },
      { startTime: '8:00' },
      { startTime: '24:00' },
      { endTime: '09:60' },
      { endTime: '08:00' },
      { startTime: '23:00', endTime: '01:00' },
    ])
      expect(
        createRoutineSchema.safeParse({
          ...routine,
          slots: [{ ...slot, ...change }],
        }).success,
      ).toBe(false);
  });
  it('rejects overlaps but accepts adjacent slots and equal times on different days', () => {
    expect(
      createRoutineSchema.safeParse({
        ...routine,
        slots: [slot, { ...slot, startTime: '08:30', endTime: '10:00' }],
      }).success,
    ).toBe(false);
    expect(
      createRoutineSchema.safeParse({
        ...routine,
        slots: [
          { ...slot, startTime: '09:00', endTime: '10:00' },
          slot,
          { ...slot, weekday: 3 },
        ],
      }).success,
    ).toBe(true);
    expect(
      routineSchema.safeParse({
        ...routine,
        id: '00000000-0000-4000-8000-000000000001',
        createdAt: '2026-09-26T12:00:00.000Z',
        updatedAt: '2026-09-26T12:00:00.000Z',
        userId: 'x',
      }).success,
    ).toBe(false);
  });
});
