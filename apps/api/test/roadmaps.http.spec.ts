import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
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
  AI_TIMEOUT_MS: 100,
};
const database = `${env.TEST_DB_NAME}_roadmaps_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let now = new Date('2026-09-26T12:00:00Z');
const content = {
  title: 'Plano',
  description: 'Aprender',
  blocks: [
    {
      title: 'Base',
      description: 'Conceitos',
      steps: [
        { title: 'Ler', description: 'Capítulo' },
        { title: 'Praticar', description: 'Exercícios' },
      ],
    },
    {
      title: 'Avançar',
      description: 'Aplicações',
      steps: [{ title: 'Projeto', description: 'Construir' }],
    },
  ],
};
const parameters = {
  currentLevel: 'BEGINNER',
  objective: 'Aprender',
  dueDate: '2027-01-01',
  weeklyHours: 2,
  knownTopics: [],
};
let output: unknown = content;
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
});
async function account() {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.com`,
    id,
    `${id}@example.com`,
  );
  await new PreferencesService(source).update(user.id, { ai: true });
  return {
    ...user,
    cookie: `edutrack_session=${await new SessionRepository(source).create(user.id)}`,
  };
}
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
    .send(
      method === 'patch' && /\/roadmaps\/[^/]+$/.test(path)
        ? { baseRevision: 1, ...body }
        : body,
    );
const read = (path: string, cookie: string) =>
  request(app).get(path).set('Cookie', cookie);
async function subject(cookie: string) {
  return (
    await write('post', '/subjects', cookie, { name: 'Álgebra', ...parameters })
  ).body.id as string;
}
async function rows(id: string) {
  return Number(
    (
      await source.query<Array<{ total: number }>>(
        'SELECT COUNT(*) AS total FROM subject_roadmaps WHERE subject_id=?',
        [id],
      )
    )[0]!.total,
  );
}
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
it('applies and rolls back both migrations with preserved manual content and simple plan', async () => {
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  const a = await account(),
    id = await subject(a.cookie);
  await write('post', `/subjects/${id}/plan-items`, a.cookie, {
    title: 'Plano simples',
  });
  const roadmap = await write(
    'post',
    `/subjects/${id}/roadmaps`,
    a.cookie,
    content,
  );
  expect(roadmap.status).toBe(201);
  await source.undoLastMigration(); // version/progress migration
  await source.undoLastMigration();
  expect(
    await source.query(
      "SHOW COLUMNS FROM subject_roadmaps LIKE 'generation_id'",
    ),
  ).toEqual([]);
  expect(
    (
      await source.query<Array<{ title: string }>>(
        'SELECT title FROM subject_roadmaps WHERE id=?',
        [roadmap.body.id],
      )
    )[0]!.title,
  ).toBe('Plano');
  expect(await source.runMigrations()).toHaveLength(2);
  expect(
    (await read(`/subjects/${id}/roadmaps/${roadmap.body.id}`, a.cookie)).body,
  ).toEqual(roadmap.body);
  await source.undoLastMigration();
  await source.undoLastMigration();
  await source.undoLastMigration();
  for (const table of [
    'subject_roadmaps',
    'subject_roadmap_blocks',
    'subject_roadmap_steps',
  ])
    expect(await source.query(`SHOW TABLES LIKE '${table}'`)).toEqual([]);
  expect((await read(`/subjects/${id}`, a.cookie)).body.planItems).toHaveLength(
    1,
  );
  expect(await source.runMigrations()).toHaveLength(3);
  await expect(
    source.query(
      'INSERT INTO subject_roadmaps (id,subject_id,title,description) VALUES (?,?,?,?)',
      [randomUUID(), randomUUID(), 'Orphan', 'Data'],
    ),
  ).rejects.toThrow();
});
it('protects all manual and AI routes with session, origin and owner; rejects inputs before provider', async () => {
  const a = await account(),
    b = await account(),
    id = await subject(a.cookie),
    other = await subject(b.cookie);
  const paths = [
    `/subjects/${id}/roadmaps`,
    `/subjects/${id}/roadmaps/${randomUUID()}`,
    `/subjects/${id}/roadmap-generations`,
    `/subjects/${id}/roadmaps/confirm-ai`,
  ];
  boundary.mockClear();
  for (const [index, path] of paths.entries()) {
    const method = index === 1 ? 'patch' : 'post';
    expect((await request(app)[method](path).send({})).status).toBe(401);
    expect(
      (await request(app)[method](path).set('Cookie', a.cookie).send({}))
        .status,
    ).toBe(403);
  }
  for (const path of paths.slice(0, 2))
    expect((await read(path, b.cookie)).status).toBe(404);
  expect(
    (
      await write(
        'post',
        `/subjects/${other}/roadmap-generations`,
        a.cookie,
        parameters,
      )
    ).status,
  ).toBe(404);
  expect(
    (await write('post', `/subjects/${other}/roadmaps`, a.cookie, content))
      .status,
  ).toBe(404);
  for (const patch of [
    { dueDate: '2026-09-26' },
    { dueDate: '2032-01-01' },
    { objective: '' },
    { weeklyHours: 81 },
    { userId: a.id },
  ])
    expect(
      (
        await write('post', `/subjects/${id}/roadmap-generations`, a.cookie, {
          ...parameters,
          ...patch,
        })
      ).status,
    ).toBe(400);
  expect(boundary).not.toHaveBeenCalled();
  expect(await rows(id)).toBe(0);
});
it('provides manual CRUD and stable pagination without configured AI, including atomic editing and cascading deletion', async () => {
  const a = await account(),
    b = await account(),
    id = await subject(a.cookie);
  const path = `/subjects/${id}/roadmaps`;
  const first = await write('post', path, a.cookie, content, manualApp);
  expect(first.status).toBe(201);
  expect(
    (
      await write(
        'post',
        `/subjects/${id}/roadmap-generations`,
        a.cookie,
        parameters,
        manualApp,
      )
    ).status,
  ).toBe(503);
  await new PreferencesService(source).update(a.id, { ai: false });
  const second = await write('post', path, a.cookie, {
    ...content,
    title: 'Segundo',
  });
  const list = (await read(`${path}?pageSize=1`, a.cookie)).body;
  expect(list).toMatchObject({ total: 2, totalPages: 2 });
  expect(list.items).toHaveLength(1);
  expect(
    (await read(`${path}?page=2&pageSize=1`, a.cookie)).body.items[0].id,
  ).not.toBe(list.items[0].id);
  for (const method of ['patch', 'delete'] as const)
    expect(
      (await write(method, `${path}/${first.body.id}`, b.cookie, content))
        .status,
    ).toBe(404);
  const changed = { ...content, blocks: [...content.blocks].reverse() };
  expect(
    (await write('patch', `${path}/${first.body.id}`, a.cookie, changed)).body
      .blocks,
  ).toMatchObject(changed.blocks);
  expect(
    (
      await write('patch', `${path}/${first.body.id}`, a.cookie, {
        ...content,
        blocks: [],
      })
    ).status,
  ).toBe(400);
  expect(
    (await read(`${path}/${first.body.id}`, a.cookie)).body.blocks,
  ).toMatchObject(changed.blocks);
  expect(
    (await write('delete', `${path}/${first.body.id}`, a.cookie)).status,
  ).toBe(204);
  expect((await read(`${path}/${first.body.id}`, a.cookie)).status).toBe(404);
  expect((await read(`${path}/${second.body.id}`, a.cookie)).status).toBe(200);
});
it('checks both preferences before provider, rejects invalid output without writing and returns validated nonpersistent preview', async () => {
  const a = await account(),
    id = await subject(a.cookie),
    prefs = new PreferencesService(source);
  boundary.mockClear();
  await prefs.update(a.id, { ai: false });
  expect(
    (
      await write(
        'post',
        `/subjects/${id}/roadmap-generations`,
        a.cookie,
        parameters,
      )
    ).body.error.code,
  ).toBe('AI_DISABLED');
  await prefs.update(a.id, { ai: true, subjects: false });
  expect(
    (
      await write(
        'post',
        `/subjects/${id}/roadmap-generations`,
        a.cookie,
        parameters,
      )
    ).body.error.code,
  ).toBe('MODULE_DISABLED');
  expect(boundary).not.toHaveBeenCalled();
  await prefs.update(a.id, { subjects: true });
  for (const invalid of [
    {},
    { ...content, blocks: [] },
    { ...content, blocks: [{ ...content.blocks[0], steps: [] }] },
    { ...content, title: 'x'.repeat(121) },
    { ...content, extra: true },
  ]) {
    output = invalid;
    expect(
      (
        await write(
          'post',
          `/subjects/${id}/roadmap-generations`,
          a.cookie,
          parameters,
        )
      ).body.error.code,
    ).toBe('AI_INVALID_RESPONSE');
    expect(await rows(id)).toBe(0);
  }
  output = content;
  const preview = await write(
    'post',
    `/subjects/${id}/roadmap-generations`,
    a.cookie,
    parameters,
  );
  expect(preview.status).toBe(200);
  expect(preview.headers['cache-control']).toContain('no-store');
  expect(preview.body).toMatchObject({ subjectId: id, parameters, content });
  expect(await rows(id)).toBe(0);
  expect((await read(`/subjects/${id}`, a.cookie)).body.planItems).toEqual([]);
});
it('confirms edited content once for concurrent and repeated requests, preserving prior roadmaps', async () => {
  const a = await account(),
    id = await subject(a.cookie);
  output = content;
  const previous = await write(
    'post',
    `/subjects/${id}/roadmaps`,
    a.cookie,
    content,
  );
  const preview = (
    await write(
      'post',
      `/subjects/${id}/roadmap-generations`,
      a.cookie,
      parameters,
    )
  ).body;
  const edited = {
    ...content,
    title: 'Editado',
    blocks: [
      {
        ...content.blocks[1]!,
        steps: [{ title: 'Novo', description: 'Editado' }],
      },
      content.blocks[0]!,
    ],
  };
  const body = { confirm: true, receipt: preview.receipt, content: edited };
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      write('post', `/subjects/${id}/roadmaps/confirm-ai`, a.cookie, body),
    ),
  );
  expect(results.map((item) => item.status)).toEqual([201, 201, 201, 201]);
  expect(new Set(results.map((item) => item.body.id)).size).toBe(1);
  expect(results[0]!.body).toMatchObject(edited);
  expect(await rows(id)).toBe(2);
  expect(
    (await read(`/subjects/${id}/roadmaps/${previous.body.id}`, a.cookie)).body,
  ).toEqual(previous.body);
  const repeated = await write(
    'post',
    `/subjects/${id}/roadmaps/confirm-ai`,
    a.cookie,
    { ...body, content },
  );
  expect(repeated.body).toEqual(results[0]!.body);
});
it('rejects forged, expired, wrong-user and wrong-subject receipts, missing confirmation and switched preferences with no writes', async () => {
  const a = await account(),
    b = await account(),
    id = await subject(a.cookie),
    other = await subject(a.cookie);
  output = content;
  const preview = (
    await write(
      'post',
      `/subjects/${id}/roadmap-generations`,
      a.cookie,
      parameters,
    )
  ).body;
  const body = { confirm: true, receipt: preview.receipt, content };
  for (const patch of [
    { confirm: false },
    { confirm: undefined },
    { content: { ...content, blocks: [] } },
    { receipt: `x${preview.receipt}` },
  ])
    expect(
      (
        await write('post', `/subjects/${id}/roadmaps/confirm-ai`, a.cookie, {
          ...body,
          ...patch,
        })
      ).status,
    ).toBe(400);
  expect(
    (
      await write(
        'post',
        `/subjects/${other}/roadmaps/confirm-ai`,
        a.cookie,
        body,
      )
    ).body.error.code,
  ).toBe('INVALID_RECEIPT');
  expect(
    (await write('post', `/subjects/${id}/roadmaps/confirm-ai`, b.cookie, body))
      .status,
  ).toBe(404);
  const prefs = new PreferencesService(source);
  await prefs.update(a.id, { ai: false });
  expect(
    (await write('post', `/subjects/${id}/roadmaps/confirm-ai`, a.cookie, body))
      .status,
  ).toBe(403);
  await prefs.update(a.id, { ai: true, subjects: false });
  expect(
    (await write('post', `/subjects/${id}/roadmaps/confirm-ai`, a.cookie, body))
      .status,
  ).toBe(403);
  await prefs.update(a.id, { subjects: true });
  now = new Date(preview.expiresAt);
  expect(
    (await write('post', `/subjects/${id}/roadmaps/confirm-ai`, a.cookie, body))
      .body.error.code,
  ).toBe('RECEIPT_EXPIRED');
  now = new Date('2026-09-26T12:00:00Z');
  expect(await rows(id)).toBe(0);
  expect(await rows(other)).toBe(0);
});
it('rolls back root and children after persistence failure and allows retry with the same receipt', async () => {
  const a = await account(),
    id = await subject(a.cookie);
  output = content;
  const manual = (
    await write('post', `/subjects/${id}/roadmaps`, a.cookie, content)
  ).body;
  const preview = (
    await write(
      'post',
      `/subjects/${id}/roadmap-generations`,
      a.cookie,
      parameters,
    )
  ).body;
  await source.query(
    "CREATE TRIGGER fail_roadmap_step BEFORE INSERT ON subject_roadmap_steps FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='forced rollback'",
  );
  const body = { confirm: true, receipt: preview.receipt, content };
  try {
    expect(
      (
        await write(
          'post',
          `/subjects/${id}/roadmaps/confirm-ai`,
          a.cookie,
          body,
        )
      ).status,
    ).toBe(500);
    expect(
      (
        await write(
          'patch',
          `/subjects/${id}/roadmaps/${manual.id}`,
          a.cookie,
          { ...content, title: 'Changed' },
        )
      ).status,
    ).toBe(500);
    expect(await rows(id)).toBe(1);
    expect(
      (await read(`/subjects/${id}/roadmaps/${manual.id}`, a.cookie)).body,
    ).toEqual(manual);
  } finally {
    await source.query('DROP TRIGGER fail_roadmap_step');
  }
  expect(
    (await write('post', `/subjects/${id}/roadmaps/confirm-ai`, a.cookie, body))
      .status,
  ).toBe(201);
  expect(await rows(id)).toBe(2);
});
it('keeps provider failures safe and nonpersistent and rechecks preferences after a slow generation', async () => {
  const a = await account(),
    id = await subject(a.cookie),
    prefs = new PreferencesService(source);
  const path = `/subjects/${id}/roadmap-generations`;
  for (const scenario of ['unavailable', 'invalid', 'timeout'] as const) {
    boundary.mockImplementationOnce(async () => {
      if (scenario === 'timeout') return new Promise<Response>(() => undefined);
      if (scenario === 'unavailable')
        return new Response('private-provider-error', { status: 500 });
      return new Response('private-provider-error');
    });
    const failed = await write('post', path, a.cookie, parameters);
    expect(failed.status).toBe(
      scenario === 'timeout' ? 504 : scenario === 'invalid' ? 502 : 503,
    );
    expect(JSON.stringify(failed.body)).not.toMatch(
      /private-provider-error|test-key|stack|instructions/,
    );
    expect(await rows(id)).toBe(0);
    expect(
      (await write('post', `/subjects/${id}/roadmaps`, a.cookie, content))
        .status,
    ).toBe(201);
    const roadmap = (await read(`/subjects/${id}/roadmaps`, a.cookie)).body
      .items[0];
    await write('delete', `/subjects/${id}/roadmaps/${roadmap.id}`, a.cookie);
  }
  boundary.mockImplementationOnce(async () => {
    await prefs.update(a.id, { ai: false });
    return Response.json({
      status: 'completed',
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: JSON.stringify(content) }],
        },
      ],
    });
  });
  expect(
    (await write('post', path, a.cookie, parameters)).body.error.code,
  ).toBe('AI_DISABLED');
  expect(await rows(id)).toBe(0);
});
