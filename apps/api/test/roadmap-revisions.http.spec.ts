import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { flattenRoadmap } from '@study-platform/contracts';
import type {
  Roadmap,
  RevisionPreview,
  RoadmapRevision,
} from '@study-platform/contracts';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
const env = {
  ...loadEnv(),
  AI_API_KEY: 'test-key',
  AI_MODEL: 'test-model',
  AI_RECEIPT_KEY: 'c'.repeat(64),
  AI_TIMEOUT_MS: 200,
};
const database = `${env.TEST_DB_NAME}_revisions_${randomBytes(4).toString('hex')}`,
  admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME }),
  source = createDataSource({ ...env, DB_NAME: database });
let now = new Date('2026-09-26T12:00:00Z');
const proposed = [
  { title: 'Consulta revisada', description: 'Consultar dados' },
  { title: 'Transações revisadas', description: 'Praticar transações' },
];
let output: unknown = { steps: proposed };
const boundary = vi.fn<typeof fetch>(async () =>
  Response.json({
    status: 'completed',
    output: [
      {
        type: 'message',
        content: [{ type: 'output_text', text: JSON.stringify(output) }],
      },
    ],
  }),
);
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
  aiFetch: boundary,
  aiClock: () => now,
});
const manualApp = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env: {
    ...env,
    AI_API_KEY: undefined,
    AI_MODEL: undefined,
    AI_RECEIPT_KEY: undefined,
  },
  aiFetch: boundary,
  aiClock: () => now,
});
const write = (
  method: 'post' | 'patch' | 'delete',
  path: string,
  cookie: string,
  body: object = {},
  target = app,
) =>
  request(target)
    [method](path)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .send(body);
const read = (path: string, cookie: string) =>
  request(app).get(path).set('Cookie', cookie);
const path = (row: Roadmap) => `/subjects/${row.subjectId}/roadmaps/${row.id}`;
const content = {
  title: 'SQL',
  description: 'Aprender SQL',
  blocks: [
    {
      title: 'SQL básico',
      description: 'Comandos',
      steps: ['DDL', 'DQL', 'DML', 'TCL'].map((title) => ({
        title,
        description: `Estudar ${title}`,
      })),
    },
  ],
};
async function setup() {
  const id = randomUUID(),
    user = await new AuthRepository(source).createGoogle(
      `${id}@example.com`,
      id,
      `${id}@example.com`,
    ),
    cookie = `edutrack_session=${await new SessionRepository(source).create(user.id)}`;
  await new PreferencesService(source).update(user.id, { ai: true });
  const subject = (
    await write('post', '/subjects', cookie, {
      name: 'Banco de dados',
      currentLevel: 'BEGINNER',
      objective: 'Aprender SQL',
      dueDate: '2027-01-01',
      weeklyHours: 2,
      knownTopics: ['Tabelas'],
    })
  ).body;
  const created = await write(
    'post',
    `/subjects/${subject.id}/roadmaps`,
    cookie,
    content,
  );
  expect(created.status).toBe(201);
  return { user, cookie, roadmap: created.body as Roadmap };
}
async function current(row: Roadmap, cookie: string) {
  return (await read(path(row), cookie)).body as Roadmap;
}
async function complete(
  row: Roadmap,
  cookie: string,
  index: number,
  completed = true,
) {
  const response = await write(
    'patch',
    `${path(row)}/steps/${flattenRoadmap(row)[index]!.id}`,
    cookie,
    { baseRevision: row.revision, completed },
  );
  expect(response.status).toBe(200);
  return response.body as Roadmap;
}
async function preview(row: Roadmap, cookie: string) {
  output = { steps: proposed };
  const steps = flattenRoadmap(row),
    pendingOrder = [steps[2]!.id, steps[1]!.id, steps[3]!.id];
  const response = await write(
    'post',
    `${path(row)}/step-regenerations`,
    cookie,
    { baseRevision: row.revision, movedStepId: steps[2]!.id, pendingOrder },
  );
  expect(response.status).toBe(200);
  return response.body as RevisionPreview;
}
const confirmation = (value: RevisionPreview) => ({
  confirm: true,
  baseRevision: value.baseRevision,
  idempotencyKey: value.idempotencyKey,
  receipt: value.receipt,
  steps: value.steps,
});
beforeAll(async () => {
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  await source.initialize();
  await source.runMigrations();
});
afterAll(async () => {
  if (source.isInitialized) await source.destroy();
  if (admin.isInitialized) {
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.destroy();
  }
});
it('migrates existing identities and order into initial snapshots and rolls back without losing steps', async () => {
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  const a = await setup(),
    original = flattenRoadmap(a.roadmap);
  await source.undoLastMigration();
  expect(
    await source.query(
      "SHOW COLUMNS FROM subject_roadmap_steps LIKE 'completed'",
    ),
  ).toEqual([]);
  expect(
    await source.query("SHOW TABLES LIKE 'subject_roadmap_revisions'"),
  ).toEqual([]);
  const rows = await source.query<Array<{ id: string; title: string }>>(
    'SELECT p.id,p.title FROM subject_roadmap_steps p JOIN subject_roadmap_blocks b ON b.id=p.block_id WHERE b.roadmap_id=? ORDER BY b.position,p.position',
    [a.roadmap.id],
  );
  expect(rows).toEqual(
    original.map((step) => ({ id: step.id, title: step.title })),
  );
  expect(await source.runMigrations()).toHaveLength(1);
  expect(flattenRoadmap(await current(a.roadmap, a.cookie))).toEqual(original);
  const history = (await read(`${path(a.roadmap)}/revisions`, a.cookie)).body;
  expect(history.total).toBe(1);
  expect(history.items[0]).toMatchObject({ revision: 1, origin: 'manual' });
  expect(flattenRoadmap(history.items[0].content)).toEqual(original);
});
it('preserves stable identity through manual editing and versions explicit completion and reopening without AI', async () => {
  const a = await setup(),
    before = flattenRoadmap(a.roadmap);
  await new PreferencesService(source).update(a.user.id, { ai: false });
  const updated = await write(
    'patch',
    path(a.roadmap),
    a.cookie,
    {
      title: 'SQL manual',
      description: a.roadmap.description,
      blocks: a.roadmap.blocks,
      baseRevision: 1,
    },
    manualApp,
  );
  expect(updated.status).toBe(200);
  expect(updated.body.revision).toBe(2);
  expect(flattenRoadmap(updated.body).map((step) => step.id)).toEqual(
    before.map((step) => step.id),
  );
  const completed = await complete(updated.body, a.cookie, 1);
  expect(completed.revision).toBe(3);
  expect(flattenRoadmap(completed)[1]!.completed).toBe(true);
  const reopened = await complete(completed, a.cookie, 1, false);
  expect(reopened.revision).toBe(4);
  expect(flattenRoadmap(reopened)[1]!.id).toBe(before[1]!.id);
  expect(flattenRoadmap(reopened)[1]!.completed).toBe(false);
  expect(
    (await read(`${path(a.roadmap)}/revisions?pageSize=2`, a.cookie)).body,
  ).toMatchObject({ total: 4, totalPages: 2 });
  expect(
    (
      await write(
        'patch',
        `${path(a.roadmap)}/steps/${before[0]!.id}`,
        a.cookie,
        { baseRevision: 1, completed: true },
      )
    ).body.error.code,
  ).toBe('REVISION_CONFLICT');
});
it('anchors DDL → DML and sends only the suffix context without persisting a preview or cancel', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    before = await current(row, a.cookie);
  boundary.mockClear();
  const candidate = await preview(row, a.cookie);
  expect(candidate.preservedCount).toBe(2);
  expect(candidate.steps.slice(0, 2)).toEqual([
    flattenRoadmap(row)[0],
    flattenRoadmap(row)[2],
  ]);
  expect(candidate.steps.map((step) => step.title)).toEqual([
    'DDL',
    'DML',
    'Consulta revisada',
    'Transações revisadas',
  ]);
  expect(await current(row, a.cookie)).toEqual(before);
  expect((await read(`${path(row)}/revisions`, a.cookie)).body.total).toBe(2);
  const sent = JSON.parse(String(boundary.mock.calls[0]![1]!.body));
  const input = JSON.parse(sent.input);
  expect(
    input.preservedPrefix.map((step: { title: string }) => step.title),
  ).toEqual(['DDL', 'DML']);
  expect(
    input.previousSuffix.map((step: { title: string }) => step.title),
  ).toEqual(['DQL', 'TCL']);
  expect(input).toMatchObject({
    subjectName: 'Banco de dados',
    objective: 'Aprender SQL',
    knownTopics: ['Tabelas'],
  });
  expect(JSON.stringify(input)).not.toContain(a.user.id);
  expect(JSON.stringify(input)).not.toContain(flattenRoadmap(row)[0]!.id);
  expect(sent.text.format.name).toBe('roadmap_suffix');
  expect(sent.store).toBe(false);
});
it('rejects moving any completed or earlier pending step and invalid permutations before contacting AI', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 1),
    steps = flattenRoadmap(row);
  boundary.mockClear();
  for (const movedStepId of [steps[0]!.id, steps[1]!.id, randomUUID()])
    expect(
      (
        await write('post', `${path(row)}/step-regenerations`, a.cookie, {
          baseRevision: row.revision,
          movedStepId,
          pendingOrder: [steps[2]!.id, steps[3]!.id],
        })
      ).body.error.code,
    ).toBe('PROTECTED_STEPS');
  for (const pendingOrder of [
    [steps[2]!.id, steps[2]!.id],
    [steps[2]!.id],
    [steps[2]!.id, randomUUID()],
    [steps[0]!.id, steps[2]!.id, steps[3]!.id],
  ])
    expect(
      (
        await write('post', `${path(row)}/step-regenerations`, a.cookie, {
          baseRevision: row.revision,
          movedStepId: steps[2]!.id,
          pendingOrder,
        })
      ).status,
    ).toBe(400);
  expect(boundary).not.toHaveBeenCalled();
  expect(await current(row, a.cookie)).toEqual(row);
  expect(
    (
      await write('patch', path(row), a.cookie, {
        baseRevision: row.revision,
        title: row.title,
        description: row.description,
        blocks: [
          { ...row.blocks[0]!, steps: [...row.blocks[0]!.steps].reverse() },
        ],
      })
    ).body.error.code,
  ).toBe('PROTECTED_STEPS');
});
it('rejects duplicate AI titles and invalid output, then rejects edited duplicate IDs/titles and forged prefix changes', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    steps = flattenRoadmap(row),
    input = {
      baseRevision: row.revision,
      movedStepId: steps[2]!.id,
      pendingOrder: [steps[2]!.id, steps[1]!.id, steps[3]!.id],
    };
  for (const bad of [
    { steps: [] },
    { steps: [{ title: ' ｄｄｌ ', description: 'Repete' }] },
    { steps: [{ title: 'X', description: 'x', id: randomUUID() }] },
    { steps: [{ title: 'x'.repeat(121), description: 'x' }] },
  ]) {
    output = bad;
    expect(
      (await write('post', `${path(row)}/step-regenerations`, a.cookie, input))
        .body.error.code,
    ).toBe('AI_INVALID_RESPONSE');
  }
  const candidate = await preview(row, a.cookie),
    body = confirmation(candidate);
  for (const edit of [
    candidate.steps.map((step, i) =>
      i === 2 ? { ...step, title: '  ｄｄｌ  ' } : step,
    ),
    candidate.steps.map((step, i) =>
      i === 3 ? { ...step, id: candidate.steps[2]!.id } : step,
    ),
  ])
    expect(
      (
        await write('post', `${path(row)}/revision-confirmations`, a.cookie, {
          ...body,
          steps: edit,
        })
      ).body.error.code,
    ).toBe('DUPLICATE_STEPS');
  for (const edit of [
    candidate.steps.map((step, i) =>
      i === 0 ? { ...step, description: 'Changed' } : step,
    ),
    candidate.steps.map((step, i) =>
      i === 1 ? { ...step, id: randomUUID() } : step,
    ),
  ])
    expect(
      (
        await write('post', `${path(row)}/revision-confirmations`, a.cookie, {
          ...body,
          steps: edit,
        })
      ).body.error.code,
    ).toBe('PROTECTED_STEPS');
  for (const patch of [
    { confirm: false },
    { idempotencyKey: randomUUID() },
    { receipt: `x${candidate.receipt}` },
    {
      steps: candidate.steps.map((step, i) =>
        i === 2 ? { ...step, completed: true } : step,
      ),
    },
    {
      steps: candidate.steps.map((step, i) =>
        i === 2 ? { ...step, id: randomUUID() } : step,
      ),
    },
  ])
    expect(
      (
        await write('post', `${path(row)}/revision-confirmations`, a.cookie, {
          ...body,
          ...patch,
        })
      ).status,
    ).toBe(400);
  expect(await current(row, a.cookie)).toEqual(row);
  expect((await read(`${path(row)}/revisions`, a.cookie)).body.total).toBe(2);
});
it('confirms edited order exactly once for concurrent retries and preserves replaced snapshots', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    candidate = await preview(row, a.cookie),
    body = confirmation(candidate);
  const edited = {
    ...body,
    steps: [
      ...candidate.steps.slice(0, 2),
      { ...candidate.steps[3]!, title: 'Transação editada' },
      candidate.steps[2]!,
    ],
  };
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      write('post', `${path(row)}/revision-confirmations`, a.cookie, edited),
    ),
  );
  expect(results.map((result) => result.status)).toEqual([201, 201, 201, 201]);
  expect(
    results.every(
      (result) =>
        JSON.stringify(result.body) === JSON.stringify(results[0]!.body),
    ),
  ).toBe(true);
  expect(results[0]!.body).toMatchObject({
    revision: 3,
    origin: 'ia',
    sourceRevision: null,
  });
  expect(flattenRoadmap(results[0]!.body.content)).toEqual(edited.steps);
  expect((await current(row, a.cookie)).revision).toBe(3);
  expect((await read(`${path(row)}/revisions`, a.cookie)).body.total).toBe(3);
  expect(
    (await read(`${path(row)}/revisions/2`, a.cookie)).body.content.blocks,
  ).toEqual(row.blocks);
  expect(
    (await write('post', `${path(row)}/revision-confirmations`, a.cookie, body))
      .body,
  ).toEqual(results[0]!.body);
});
it('rejects stale previews after manual edits or progression and allows only one of different concurrent confirmations', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    old = await preview(row, a.cookie);
  const manual = await write('patch', path(row), a.cookie, {
    baseRevision: row.revision,
    title: 'Edited',
    description: row.description,
    blocks: row.blocks,
  });
  expect(manual.status).toBe(200);
  expect(
    (
      await write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(old),
      )
    ).body.error.code,
  ).toBe('REVISION_CONFLICT');
  const first = await preview(manual.body, a.cookie),
    second = await preview(manual.body, a.cookie);
  const results = await Promise.all(
    [first, second].map((candidate) =>
      write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(candidate),
      ),
    ),
  );
  expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
  const active = await current(row, a.cookie),
    next = await complete(active, a.cookie, active.blocks[0]!.steps.length - 1);
  expect(next.revision).toBe(active.revision + 1);
});
it('restores historical pending steps while protecting later progress, and creates a new idempotent revision without AI', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    candidate = await preview(row, a.cookie);
  expect(
    (
      await write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(candidate),
      )
    ).status,
  ).toBe(201);
  const completed = await complete(await current(row, a.cookie), a.cookie, 2),
    beforeHistory = (await read(`${path(row)}/revisions`, a.cookie)).body.items;
  await new PreferencesService(source).update(a.user.id, { ai: false });
  boundary.mockClear();
  const restoration = await write(
    'post',
    `${path(row)}/restoration-previews`,
    a.cookie,
    { baseRevision: completed.revision, sourceRevision: 1 },
    manualApp,
  );
  expect(restoration.status).toBe(200);
  const previewed = restoration.body as RevisionPreview;
  expect(previewed.steps.slice(0, 3)).toEqual(
    flattenRoadmap(completed).slice(0, 3),
  );
  expect(previewed.steps.slice(3).map((step) => step.title)).toEqual([
    'DQL',
    'TCL',
  ]);
  expect(await current(row, a.cookie)).toEqual(completed);
  expect((await read(`${path(row)}/revisions`, a.cookie)).body.items).toEqual(
    beforeHistory,
  );
  const results = await Promise.all(
    Array.from({ length: 3 }, () =>
      write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(previewed),
        manualApp,
      ),
    ),
  );
  expect(results.map((result) => result.status)).toEqual([201, 201, 201]);
  expect(results[0]!.body).toMatchObject({
    revision: 5,
    origin: 'restauracao',
    sourceRevision: 1,
  });
  expect(flattenRoadmap(results[0]!.body.content).slice(0, 3)).toEqual(
    flattenRoadmap(completed).slice(0, 3),
  );
  expect(
    (await read(`${path(row)}/revisions`, a.cookie)).body.items.slice(1),
  ).toEqual(beforeHistory);
  expect(boundary).not.toHaveBeenCalled();
});
it('reports restoration incompatibility from distinct identities with equal normalized titles without replacing progress', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0);
  output = { steps: [{ title: 'DQL', description: 'New identity' }] };
  const active = flattenRoadmap(row),
    generated = await write(
      'post',
      `${path(row)}/step-regenerations`,
      a.cookie,
      {
        baseRevision: row.revision,
        movedStepId: active[2]!.id,
        pendingOrder: [active[2]!.id, active[1]!.id, active[3]!.id],
      },
    );
  expect(generated.status).toBe(200);
  expect(
    (
      await write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(generated.body),
      )
    ).status,
  ).toBe(201);
  const completed = await complete(await current(row, a.cookie), a.cookie, 2);
  expect(
    (
      await write('post', `${path(row)}/restoration-previews`, a.cookie, {
        baseRevision: completed.revision,
        sourceRevision: 1,
      })
    ).body.error.code,
  ).toBe('RESTORATION_INCOMPATIBLE');
  expect(await current(row, a.cookie)).toEqual(completed);
});
it('isolates every history, restoration, generation and confirmation route and rechecks module/AI preferences', async () => {
  const a = await setup(),
    b = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    candidate = await preview(row, a.cookie);
  boundary.mockClear();
  for (const route of ['/revisions', '/revisions/1']) {
    expect((await request(app).get(path(row) + route)).status).toBe(401);
    expect((await read(path(row) + route, b.cookie)).status).toBe(404);
  }
  for (const route of [
    '/step-regenerations',
    '/revision-confirmations',
    '/restoration-previews',
  ]) {
    expect(
      (
        await request(app)
          .post(path(row) + route)
          .send({})
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post(path(row) + route)
          .set('Cookie', a.cookie)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await write(
          'post',
          path(row) + route,
          b.cookie,
          confirmation(candidate),
        )
      ).status,
    ).toBe(404);
  }
  expect(
    (
      await write(
        'post',
        `${path(b.roadmap)}/revision-confirmations`,
        b.cookie,
        confirmation(candidate),
      )
    ).body.error.code,
  ).toBe('INVALID_RECEIPT');
  expect((await read(`${path(row)}/revisions/bad`, a.cookie)).status).toBe(404);
  await new PreferencesService(source).update(a.user.id, { ai: false });
  expect(
    (
      await write('post', `${path(row)}/step-regenerations`, a.cookie, {
        baseRevision: row.revision,
        movedStepId: row.blocks[0]!.steps[2]!.id,
        pendingOrder: row.blocks[0]!.steps.slice(1).map((step) => step.id),
      })
    ).body.error.code,
  ).toBe('AI_DISABLED');
  expect(
    (
      await write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(candidate),
      )
    ).body.error.code,
  ).toBe('AI_DISABLED');
  expect((await read(`${path(row)}/revisions`, a.cookie)).status).toBe(200);
  await new PreferencesService(source).update(a.user.id, { subjects: false });
  expect((await read(`${path(row)}/revisions`, a.cookie)).status).toBe(403);
  expect(boundary).not.toHaveBeenCalled();
});
it('rolls back active content and snapshots after SQL failure, supports safe retry, and cascades all history on deletion', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    candidate = await preview(row, a.cookie),
    before = (await read(`${path(row)}/revisions`, a.cookie)).body;
  await source.query(
    "CREATE TRIGGER fail_revision BEFORE INSERT ON subject_roadmap_revisions FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='forced snapshot failure'",
  );
  try {
    const failed = await write(
      'post',
      `${path(row)}/revision-confirmations`,
      a.cookie,
      confirmation(candidate),
    );
    expect(failed.status).toBe(500);
    expect(JSON.stringify(failed.body)).not.toMatch(/forced|stack|test-key/);
    expect(await current(row, a.cookie)).toEqual(row);
    expect((await read(`${path(row)}/revisions`, a.cookie)).body).toEqual(
      before,
    );
  } finally {
    await source.query('DROP TRIGGER fail_revision');
  }
  expect(
    (
      await write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(candidate),
      )
    ).status,
  ).toBe(201);
  expect((await write('delete', path(row), a.cookie)).status).toBe(204);
  expect(
    await source.query(
      'SELECT * FROM subject_roadmap_revisions WHERE roadmap_id=?',
      [row.id],
    ),
  ).toEqual([]);
  expect((await read(`${path(row)}/revisions`, a.cookie)).status).toBe(404);
});
it('rejects expired previews and preserves active content after provider failure or preference change during generation', async () => {
  const a = await setup(),
    row = await complete(a.roadmap, a.cookie, 0),
    candidate = await preview(row, a.cookie),
    active = flattenRoadmap(row),
    input = {
      baseRevision: row.revision,
      movedStepId: active[2]!.id,
      pendingOrder: [active[2]!.id, active[1]!.id, active[3]!.id],
    };
  now = new Date(candidate.expiresAt);
  expect(
    (
      await write(
        'post',
        `${path(row)}/revision-confirmations`,
        a.cookie,
        confirmation(candidate),
      )
    ).body.error.code,
  ).toBe('RECEIPT_EXPIRED');
  now = new Date('2026-09-26T12:00:00Z');
  boundary.mockImplementationOnce(
    async () => new Response('private-error', { status: 503 }),
  );
  const failed = await write(
    'post',
    `${path(row)}/step-regenerations`,
    a.cookie,
    input,
  );
  expect(failed.status).toBe(503);
  expect(JSON.stringify(failed.body)).not.toMatch(/private-error|test-key/);
  expect(await current(row, a.cookie)).toEqual(row);
  boundary.mockImplementationOnce(async () => {
    await new PreferencesService(source).update(a.user.id, { ai: false });
    return Response.json({
      status: 'completed',
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: JSON.stringify({ steps: proposed }) },
          ],
        },
      ],
    });
  });
  expect(
    (await write('post', `${path(row)}/step-regenerations`, a.cookie, input))
      .body.error.code,
  ).toBe('AI_DISABLED');
  expect((await read(`${path(row)}/revisions`, a.cookie)).body.total).toBe(2);
});
