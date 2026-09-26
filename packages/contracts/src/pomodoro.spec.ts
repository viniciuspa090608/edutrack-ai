import { describe, expect, it } from 'vitest';
import {
  startPomodoroSchema,
  pomodoroCommandSchema,
  pomodoroSessionSchema,
  pomodoroPageSchema,
} from './pomodoro.js';
describe('Pomodoro contracts', () => {
  it('rejects client ownership, time and unknown command fields', () => {
    for (const input of [
      { userId: 'x' },
      { activeSeconds: 1500 },
      { taskId: 'bad' },
    ])
      expect(startPomodoroSchema.safeParse(input).success).toBe(false);
    for (const input of [
      {},
      { version: -1 },
      { version: 1, activeSeconds: 1500 },
      { version: 1.5 },
    ])
      expect(pomodoroCommandSchema.safeParse(input).success).toBe(false);
    expect(startPomodoroSchema.parse({})).toEqual({});
    expect(pomodoroCommandSchema.parse({ version: 0 })).toEqual({ version: 0 });
    expect(pomodoroPageSchema.safeParse({ userId: 'x' }).success).toBe(false);
  });
  it('validates public responses without persistence fields', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      taskId: null,
      subjectId: null,
      state: 'PAUSED',
      activeSeconds: 600,
      completedBlocks: 0,
      remainingSeconds: 900,
      version: 1,
      startedAt: '2026-09-26T12:00:00.000Z',
      endedAt: null,
      serverTime: '2026-09-26T12:10:00.000Z',
    };
    expect(pomodoroSessionSchema.parse(row)).toEqual(row);
    expect(
      pomodoroSessionSchema.safeParse({ ...row, userId: 'x' }).success,
    ).toBe(false);
    expect(
      pomodoroSessionSchema.safeParse({ ...row, remainingSeconds: 1501 })
        .success,
    ).toBe(false);
  });
});
