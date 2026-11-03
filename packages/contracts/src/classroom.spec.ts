import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  classroomConnectionSchema,
  classroomSelectionSchema,
  classroomStartOperationSchema,
  classroomTaskImportSchema,
} from './classroom.js';

describe('Classroom public boundary', () => {
  it('rejects duplicate courses, unknown ownership and missing subject planning', () => {
    expect(
      classroomSelectionSchema.safeParse({
        courses: [
          {
            courseId: '1',
            destination: { kind: 'new', subject: { name: 'Math' } },
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      classroomStartOperationSchema.safeParse({
        requestId: randomUUID(),
        courseIds: ['1', '1'],
      }).success,
    ).toBe(false);
    expect(
      classroomStartOperationSchema.safeParse({
        requestId: randomUUID(),
        courseIds: ['1'],
        userId: randomUUID(),
      }).success,
    ).toBe(false);
  });
  it('never includes credentials in connection DTOs', () => {
    const connection = {
      available: true,
      state: 'disconnected',
      account: null,
      permissions: {
        courses: false,
        coursework: false,
        teacherCoursework: false,
      },
      version: 0,
    };
    expect(classroomConnectionSchema.safeParse(connection).success).toBe(true);
    expect(
      classroomConnectionSchema.safeParse({
        ...connection,
        accessToken: 'secret',
      }).success,
    ).toBe(false);
  });
  it('preserves an absent deadline and rejects active source links', () => {
    const input = {
      receiptId: randomUUID(),
      connectionVersion: 1,
      source: {
        googleSubject: 'g',
        courseId: 'c',
        itemId: 'a',
        courseName: 'Math',
        link: 'https://classroom.google.com/c/1',
        attachments: [],
        originalDueDate: null,
        originalDueTime: null,
        dueAt: null,
        timeZone: 'UTC',
      },
      task: { title: 'Activity' },
    };
    expect(classroomTaskImportSchema.parse(input).task.dueDate).toBeNull();
    expect(
      classroomTaskImportSchema.safeParse({
        ...input,
        source: { ...input.source, link: 'javascript:alert(1)' },
      }).success,
    ).toBe(false);
  });
});
