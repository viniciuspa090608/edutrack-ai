import { expect, it } from 'vitest';
import {
  confirmRevisionSchema,
  regenerateStepsSchema,
  restorationRequestSchema,
  stepProgressSchema,
  sequenceSchema,
  sequenceDuplicates,
  sequenceBlocks,
  normalizedStepTitle,
  completedBoundary,
} from './roadmap-revisions.js';
import { roadmapSchema, updateRoadmapSchema } from './roadmaps.js';
const id = '00000000-0000-4000-8000-000000000001';
const step = {
  id,
  title: ' DDL ',
  description: 'Definição',
  completed: true,
  blockTitle: 'SQL',
  blockDescription: 'Banco de dados',
};
it('validates strict regeneration, explicit confirmation, restoration and progress commands', () => {
  expect(
    regenerateStepsSchema.safeParse({
      baseRevision: 1,
      movedStepId: id,
      pendingOrder: [id],
    }).success,
  ).toBe(true);
  for (const input of [
    { baseRevision: 0, movedStepId: id, pendingOrder: [id] },
    { baseRevision: 1, movedStepId: 'bad', pendingOrder: [id] },
    { baseRevision: 1, movedStepId: id, pendingOrder: [] },
    { baseRevision: 1, movedStepId: id, pendingOrder: [id], userId: id },
  ])
    expect(regenerateStepsSchema.safeParse(input).success).toBe(false);
  const confirm = {
    confirm: true,
    baseRevision: 1,
    receipt: 'receipt',
    idempotencyKey: id,
    steps: [step],
  };
  expect(confirmRevisionSchema.safeParse(confirm).success).toBe(true);
  for (const patch of [
    { confirm: false },
    { receipt: '' },
    { baseRevision: 0 },
    { steps: [] },
    { steps: [{ ...step, id: 'bad' }] },
    { steps: [{ ...step, title: 'x'.repeat(121) }] },
    { steps: [{ ...step, description: 'x'.repeat(1001) }] },
    { steps: [{ ...step, completed: 'yes' }] },
    { steps: [{ ...step, userId: id }] },
    { receipt: 'x'.repeat(24577) },
  ])
    expect(
      confirmRevisionSchema.safeParse({ ...confirm, ...patch }).success,
    ).toBe(false);
  expect(
    restorationRequestSchema.safeParse({ baseRevision: 1, sourceRevision: 0 })
      .success,
  ).toBe(false);
  expect(
    stepProgressSchema.safeParse({ baseRevision: 1, completed: true }).success,
  ).toBe(true);
  expect(
    stepProgressSchema.safeParse({ baseRevision: 1, completed: true, id })
      .success,
  ).toBe(false);
});
it('bounds sequences, groups steps into bounded blocks, normalizes Unicode and detects IDs or titles', () => {
  expect(normalizedStepTitle('  ＤＤＬ\t Comandos ')).toBe('ddl comandos');
  expect(
    sequenceDuplicates([
      step,
      { ...step, id: '00000000-0000-4000-8000-000000000002', title: 'ＤＤＬ' },
    ]),
  ).toEqual(['ＤＤＬ']);
  expect(sequenceDuplicates([step, { ...step, title: 'Outro' }])).toEqual([
    'Outro',
  ]);
  expect(
    completedBoundary([
      { ...step, completed: false },
      step,
      { ...step, completed: false },
    ]),
  ).toBe(2);
  expect(sequenceSchema.safeParse(Array(401).fill(step)).success).toBe(false);
  expect(
    sequenceBlocks(Array(21).fill(step)).map((block) => block.steps.length),
  ).toEqual([20, 1]);
});
it('requires persisted IDs, completion and active revision while manual updates accept identity for new steps', () => {
  const blocks = [
    {
      title: 'SQL',
      description: 'Dados',
      steps: [{ id, title: 'DDL', description: 'Definição', completed: false }],
    },
  ];
  const row = {
    title: 'Roadmap',
    description: 'Aprender',
    blocks,
    id,
    subjectId: id,
    revision: 1,
    createdAt: '2026-09-26T12:00:00Z',
    updatedAt: '2026-09-26T12:00:00Z',
  };
  expect(roadmapSchema.safeParse(row).success).toBe(true);
  expect(roadmapSchema.safeParse({ ...row, revision: undefined }).success).toBe(
    false,
  );
  expect(
    updateRoadmapSchema.safeParse({
      title: row.title,
      description: row.description,
      blocks,
      baseRevision: 1,
    }).success,
  ).toBe(true);
  expect(
    updateRoadmapSchema.safeParse({
      title: row.title,
      description: row.description,
      blocks,
    }).success,
  ).toBe(false);
});
