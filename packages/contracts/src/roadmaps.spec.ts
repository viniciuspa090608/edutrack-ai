import { expect, it } from 'vitest';
import {
  confirmRoadmapSchema,
  generationParametersSchema,
  roadmapContentSchema,
  roadmapPreviewSchema,
} from './roadmaps.js';
const content = {
  title: ' Roteiro ',
  description: ' Plano ',
  blocks: [
    {
      title: 'Base',
      description: 'Conceitos',
      steps: [{ title: 'Ler', description: 'Capítulo' }],
    },
  ],
};
const now = new Date('2026-09-26T12:00:00Z');
const parameters = {
  currentLevel: 'BEGINNER',
  objective: ' Aprender ',
  dueDate: '2026-09-27',
  weeklyHours: 0.5,
  knownTopics: [],
};
it('validates strict roadmap structure and all title, description and array boundaries', () => {
  expect(roadmapContentSchema.parse(content).title).toBe('Roteiro');
  const maxStep = { title: 'x'.repeat(120), description: 'x'.repeat(1000) };
  expect(
    roadmapContentSchema.safeParse({
      ...maxStep,
      blocks: Array.from({ length: 20 }, () => ({
        ...maxStep,
        steps: Array.from({ length: 20 }, () => maxStep),
      })),
    }).success,
  ).toBe(true);
  for (const patch of [
    { title: '' },
    { title: 'x'.repeat(121) },
    { description: '' },
    { description: 'x'.repeat(1001) },
    { blocks: [] },
    { blocks: Array(21).fill(content.blocks[0]) },
    { extra: true },
    { blocks: [{ ...content.blocks[0], steps: [] }] },
    {
      blocks: [
        {
          ...content.blocks[0],
          steps: Array(21).fill(content.blocks[0]!.steps[0]),
        },
      ],
    },
    { blocks: [{ ...content.blocks[0], extra: true }] },
    {
      blocks: [
        {
          ...content.blocks[0],
          steps: [{ ...content.blocks[0]!.steps[0], extra: true }],
        },
      ],
    },
  ])
    expect(
      roadmapContentSchema.safeParse({ ...content, ...patch }).success,
    ).toBe(false);
});
it('validates generation calendar dates, future horizon, levels, hours and known topics', () => {
  const schema = generationParametersSchema(now);
  expect(schema.parse(parameters).objective).toBe('Aprender');
  expect(
    schema.safeParse({
      ...parameters,
      dueDate: '2031-09-26',
      weeklyHours: 80,
      knownTopics: Array(30).fill('x'.repeat(120)),
    }).success,
  ).toBe(true);
  for (const patch of [
    { currentLevel: 'EXPERT' },
    { objective: '' },
    { objective: 'x'.repeat(501) },
    { dueDate: '2026-09-26' },
    { dueDate: '2025-02-29' },
    { dueDate: '2031-09-27' },
    { weeklyHours: 0.49 },
    { weeklyHours: 80.1 },
    { knownTopics: [' '] },
    { knownTopics: ['x'.repeat(121)] },
    { knownTopics: Array(31).fill('x') },
    { userId: 'extra' },
  ])
    expect(schema.safeParse({ ...parameters, ...patch }).success).toBe(false);
});
it('requires explicit confirmation and validates previews and bounded receipts', () => {
  expect(
    confirmRoadmapSchema.safeParse({
      confirm: true,
      receipt: 'receipt',
      content,
    }).success,
  ).toBe(true);
  for (const patch of [
    { confirm: false },
    { confirm: undefined },
    { receipt: '' },
    { receipt: 'x'.repeat(2049) },
    { userId: 'extra' },
  ])
    expect(
      confirmRoadmapSchema.safeParse({
        confirm: true,
        receipt: 'receipt',
        content,
        ...patch,
      }).success,
    ).toBe(false);
  expect(
    roadmapPreviewSchema.safeParse({
      subjectId: 'bad',
      parameters,
      content,
      receipt: 'a',
      expiresAt: now.toISOString(),
    }).success,
  ).toBe(false);
});
