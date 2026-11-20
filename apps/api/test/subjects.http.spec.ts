import { SubjectsRepository } from '../src/modules/subjects/subjects.repository.js';
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
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_subjects_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let now = new Date('2026-09-26T12:00:00Z');
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
  pomodoroClock: async () => now,
});
const input = {
  name: ' Álgebra ',
  currentLevel: 'BEGINNER',
  objective: 'Aprender',
  dueDate: '2024-02-29',
  weeklyHours: 1.5,
  knownTopics: [],
};
async function account() {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.com`,
    id,
    `${id}@example.com`,
  );
  return {
    ...user,
    cookie: `edutrack_session=${await new SessionRepository(source).create(user.id)}`,
  };
}
const write = (
  method: 'post' | 'patch' | 'put' | 'delete',
  path: string,
  cookie: string,
  body: object = {},
) =>
  request(app)
    [method](path)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .send(body);
const read = (path: string, cookie: string) =>
  request(app).get(path).set('Cookie', cookie);
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
it('applies and reverses both migrations on real MySQL with foreign keys and indexes', async () => {
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  for (const table of ['study_tasks', 'pomodoro_sessions']) {
    const indexes = await source.query<Array<{ Key_name: string }>>(
      `SHOW INDEX FROM ${table}`,
    );
    expect(indexes.map((row) => row.Key_name)).toContain(
      `ix_${table}_owner_subject`,
    );
  }
  const applied = await source.query<Array<{ name: string }>>(
    'SELECT name FROM migrations ORDER BY id DESC',
  );
  const later = applied.slice(
    0,
    applied.findIndex(
      (migration) => migration.name === 'AddSubjectAssociations20260926221000',
    ),
  );
  for (const _migration of later) {
    void _migration;
    await source.undoLastMigration();
  }
  await source.undoLastMigration();
  expect(
    await source.query("SHOW COLUMNS FROM study_tasks LIKE 'subject_id'"),
  ).toEqual([]);
  await source.undoLastMigration();
  for (const table of [
    'study_subjects',
    'subject_known_topics',
    'subject_plan_items',
  ])
    expect(await source.query(`SHOW TABLES LIKE '${table}'`)).toEqual([]);
  expect(await source.runMigrations()).toHaveLength(2 + later.length);
  await expect(
    source.query(
      'INSERT INTO subject_plan_items (id,subject_id,title,position) VALUES (?,?,?,0)',
      [randomUUID(), randomUUID(), 'Órfão'],
    ),
  ).rejects.toThrow();
});
it('searches literal name fragments across pages and counts only owned results', async () => {
  const a = await account();
  const b = await account();
  for (const [owner, name] of [
    [a, 'Álgebra %_ I'],
    [a, 'Álgebra %_ II'],
    [a, 'Álgebra XX III'],
    [b, 'Álgebra %_ IV'],
  ] as const) {
    expect(
      (await write('post', '/subjects', owner.cookie, { ...input, name }))
        .status,
    ).toBe(201);
  }
  const query = '/subjects?pageSize=1&name=%20%C3%81LGEBRA%20%25_%20';
  const first = await read(query, a.cookie);
  const second = await read(`${query}&page=2`, a.cookie);
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect(first.body).toMatchObject({ total: 2, totalPages: 2 });
  expect(second.body).toMatchObject({ page: 2, total: 2 });
  expect(
    new Set([first.body.items[0].name, second.body.items[0].name]),
  ).toEqual(new Set(['Álgebra %_ I', 'Álgebra %_ II']));
});

it('requires session and origin, validates all fields and rejects client ownership', async () => {
  const a = await account();
  const id = randomUUID();
  for (const path of ['/subjects', `/subjects/${id}`])
    expect((await request(app).get(path)).status).toBe(401);
  for (const [method, path] of [
    ['post', '/subjects'],
    ['patch', `/subjects/${id}`],
    ['delete', `/subjects/${id}`],
    ['post', `/subjects/${id}/plan-items`],
    ['put', `/subjects/${id}/plan-items/order`],
    ['patch', `/subjects/${id}/plan-items/${id}`],
    ['delete', `/subjects/${id}/plan-items/${id}`],
  ] as const) {
    expect((await request(app)[method](path).send({})).status).toBe(401);
    expect(
      (await request(app)[method](path).set('Cookie', a.cookie).send({}))
        .status,
    ).toBe(403);
  }
  for (const fields of [
    { name: '' },
    { weeklyHours: 1.25 },
    { dueDate: '2025-02-29' },
    { knownTopics: ['a', ' A '] },
    { userId: a.id },
    { currentLevel: 'bad' },
  ])
    expect(
      (await write('post', '/subjects', a.cookie, { ...input, ...fields }))
        .status,
    ).toBe(400);
  expect((await read('/subjects', a.cookie)).body.total).toBe(0);
  expect((await read('/subjects/bad', a.cookie)).status).toBe(404);
});
it('isolates owners, paginates stably, partially edits and replaces topics transactionally', async () => {
  const a = await account(),
    b = await account();
  const row = (await write('post', '/subjects', a.cookie, input)).body;
  expect(row).toMatchObject({
    name: 'Álgebra',
    knownTopics: [],
    planItems: [],
    weeklyHours: 1.5,
    dueDate: '2024-02-29',
  });
  expect(row).not.toHaveProperty('userId');
  for (const method of ['patch', 'delete'] as const)
    expect(
      (await write(method, `/subjects/${row.id}`, b.cookie, { name: 'Ataque' }))
        .status,
    ).toBe(404);
  expect((await read(`/subjects/${row.id}`, b.cookie)).status).toBe(404);
  expect((await read('/subjects', b.cookie)).body.items).toEqual([]);
  expect(
    (await write('patch', `/subjects/${row.id}`, a.cookie, {})).status,
  ).toBe(400);
  const changed = await write('patch', `/subjects/${row.id}`, a.cookie, {
    objective: 'Novo',
    knownTopics: [' b ', 'a'],
  });
  expect(changed.body).toMatchObject({
    ...row,
    objective: 'Novo',
    knownTopics: ['b', 'a'],
    updatedAt: expect.any(String),
  });
  await source.query(
    "CREATE TRIGGER subject_test_failure BEFORE INSERT ON subject_known_topics FOR EACH ROW BEGIN IF NEW.name='FAIL' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test'; END IF; END",
  );
  try {
    expect(
      (
        await write('patch', `/subjects/${row.id}`, a.cookie, {
          name: 'Não salvar',
          knownTopics: ['FAIL'],
        })
      ).status,
    ).toBe(500);
    expect((await read(`/subjects/${row.id}`, a.cookie)).body).toEqual(
      changed.body,
    );
  } finally {
    await source.query('DROP TRIGGER subject_test_failure');
  }
  await write('post', '/subjects', a.cookie, { ...input, name: 'Outra' });
  const first = (await read('/subjects?pageSize=1', a.cookie)).body,
    second = (await read('/subjects?pageSize=1&page=2', a.cookie)).body;
  expect(first.total).toBe(2);
  expect(first.items[0].id).not.toBe(second.items[0].id);
});
it('maintains ordered manual plans with AI disabled and rejects incomplete, repeated or foreign sequences atomically', async () => {
  const a = await account(),
    b = await account();
  await new PreferencesService(source).update(a.id, {
    ai: false,
    tasks: false,
    subjects: true,
  });
  const row = (await write('post', '/subjects', a.cookie, input)).body;
  const other = (await write('post', '/subjects', b.cookie, input)).body;
  const one = (
    await write('post', `/subjects/${row.id}/plan-items`, a.cookie, {
      title: ' Primeiro ',
    })
  ).body.planItems[0];
  const two = (
    await write('post', `/subjects/${row.id}/plan-items`, a.cookie, {
      title: 'Segundo',
    })
  ).body.planItems[1];
  const foreign = (
    await write('post', `/subjects/${other.id}/plan-items`, b.cookie, {
      title: 'Alheio',
    })
  ).body.planItems[0];
  for (const [ids, status] of [
    [[one.id], 400],
    [[one.id, one.id], 400],
    [[one.id, foreign.id], 404],
  ] as const)
    expect(
      (
        await write('put', `/subjects/${row.id}/plan-items/order`, a.cookie, {
          ids,
        })
      ).status,
    ).toBe(status);
  expect(
    (await read(`/subjects/${row.id}`, a.cookie)).body.planItems.map(
      (item: { id: string }) => item.id,
    ),
  ).toEqual([one.id, two.id]);
  for (const method of ['patch', 'delete'] as const)
    expect(
      (
        await write(
          method,
          `/subjects/${row.id}/plan-items/${foreign.id}`,
          a.cookie,
          { title: 'Ataque' },
        )
      ).status,
    ).toBe(404);
  expect(
    (
      await write('post', `/subjects/${row.id}/plan-items`, a.cookie, {
        title: '',
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await write('put', `/subjects/${row.id}/plan-items/order`, b.cookie, {
        ids: [two.id, one.id],
      })
    ).status,
  ).toBe(404);
  await write('put', `/subjects/${row.id}/plan-items/order`, a.cookie, {
    ids: [two.id, one.id],
  });
  await write('patch', `/subjects/${row.id}/plan-items/${two.id}`, a.cookie, {
    title: 'Novo',
    status: 'COMPLETED',
  });
  expect(
    (await read(`/subjects/${row.id}`, a.cookie)).body.planItems[0],
  ).toMatchObject({
    id: two.id,
    title: 'Novo',
    status: 'COMPLETED',
    position: 0,
  });
  await write('delete', `/subjects/${row.id}/plan-items/${two.id}`, a.cookie);
  expect(
    (await read(`/subjects/${row.id}`, a.cookie)).body.planItems,
  ).toMatchObject([{ id: one.id, position: 0, status: 'PENDING' }]);
  await write('delete', `/subjects/${row.id}`, a.cookie);
  expect(
    await source.query('SELECT id FROM subject_plan_items WHERE subject_id=?', [
      row.id,
    ]),
  ).toEqual([]);
  expect(
    (await read(`/subjects/${other.id}`, b.cookie)).body.planItems,
  ).toHaveLength(1);
});
it('links tasks and sessions independently, validates ownership and preserves historical context and totals after deletion', async () => {
  const a = await account(),
    b = await account();
  const row = (await write('post', '/subjects', a.cookie, input)).body;
  const other = (
    await write('post', '/subjects', a.cookie, { ...input, name: 'Outra' })
  ).body;
  const foreign = (await write('post', '/subjects', b.cookie, input)).body;
  expect(
    (await write('post', '/tasks', a.cookie, { title: 'Sem' })).body.subjectId,
  ).toBeNull();
  const task = (
    await write('post', '/tasks', a.cookie, { title: 'Com', subjectId: row.id })
  ).body;
  expect(task.subjectId).toBe(row.id);
  for (const subjectId of [foreign.id, randomUUID()]) {
    expect(
      (await write('patch', `/tasks/${task.id}`, a.cookie, { subjectId }))
        .status,
    ).toBe(404);
    expect(
      (await write('post', '/pomodoro/sessions', a.cookie, { subjectId }))
        .status,
    ).toBe(404);
  }
  expect(
    (
      await write('post', '/pomodoro/sessions', a.cookie, {
        taskId: task.id,
        subjectId: other.id,
      })
    ).status,
  ).toBe(400);
  const session = (
    await write('post', '/pomodoro/sessions', a.cookie, {
      taskId: task.id,
      subjectId: row.id,
    })
  ).body;
  await write('patch', `/tasks/${task.id}`, a.cookie, { subjectId: other.id });
  expect(
    (await read(`/pomodoro/sessions/${session.id}`, a.cookie)).body.subjectId,
  ).toBe(row.id);
  now = new Date(now.getTime() + 1_500_000);
  const ended = (
    await write('post', `/pomodoro/sessions/${session.id}/complete`, a.cookie, {
      version: 0,
    })
  ).body;
  expect(ended).toMatchObject({ activeSeconds: 1500, completedBlocks: 1 });
  expect(
    (await read(`/pomodoro/sessions?subjectId=${row.id}`, a.cookie)).body.total,
  ).toBe(1);
  expect(
    (await read(`/tasks?subjectId=${other.id}`, a.cookie)).body.items.map(
      (item: { id: string }) => item.id,
    ),
  ).toEqual([task.id]);
  await write('patch', `/tasks/${task.id}`, a.cookie, { subjectId: row.id });
  await write('delete', `/subjects/${row.id}`, a.cookie);
  expect((await read(`/tasks/${task.id}`, a.cookie)).body.subjectId).toBeNull();
  expect(
    (await read(`/pomodoro/sessions/${session.id}`, a.cookie)).body,
  ).toMatchObject({ subjectId: null, activeSeconds: 1500, completedBlocks: 1 });
  expect((await read('/pomodoro/summary', a.cookie)).body).toEqual({
    activeSeconds: 1500,
    completedBlocks: 1,
  });
  expect(
    (await write('patch', `/tasks/${task.id}`, a.cookie, { subjectId: row.id }))
      .status,
  ).toBe(404);
  const unlinked = (
    await write('post', '/pomodoro/sessions', a.cookie, {
      taskId: task.id,
      subjectId: other.id,
    })
  ).body;
  expect(unlinked.subjectId).toBe(other.id);
  await write('post', `/pomodoro/sessions/${unlinked.id}/cancel`, a.cookie, {
    version: 0,
  });
});
it('preserves data and existing links while disabled, blocks new links and restores them on reactivation', async () => {
  const a = await account();
  const prefs = new PreferencesService(source);
  const row = (await write('post', '/subjects', a.cookie, input)).body;
  const task = (
    await write('post', '/tasks', a.cookie, {
      title: 'Vinculada',
      subjectId: row.id,
    })
  ).body;
  await prefs.update(a.id, { subjects: false });
  for (const path of ['/subjects', `/subjects/${row.id}`])
    expect((await read(path, a.cookie)).status).toBe(403);
  expect((await write('post', '/subjects', a.cookie, input)).status).toBe(403);
  expect(
    (
      await write('post', '/tasks', a.cookie, {
        title: 'Vínculo',
        subjectId: row.id,
      })
    ).status,
  ).toBe(403);
  expect(
    (await write('post', '/pomodoro/sessions', a.cookie, { subjectId: row.id }))
      .status,
  ).toBe(403);
  expect(
    (
      await write('patch', `/tasks/${task.id}`, a.cookie, {
        title: 'Preservada',
      })
    ).body.subjectId,
  ).toBe(row.id);
  expect(
    (await write('post', '/tasks', a.cookie, { title: 'Livre' })).status,
  ).toBe(201);
  const free = (await write('post', '/pomodoro/sessions', a.cookie, {})).body;
  expect(free.subjectId).toBeNull();
  await write('post', `/pomodoro/sessions/${free.id}/cancel`, a.cookie, {
    version: 0,
  });
  await prefs.update(a.id, { subjects: true });
  expect((await read(`/subjects/${row.id}`, a.cookie)).status).toBe(200);
  expect((await read(`/tasks/${task.id}`, a.cookie)).body.subjectId).toBe(
    row.id,
  );
  expect(
    (await write('patch', `/tasks/${task.id}`, a.cookie, { subjectId: null }))
      .body.subjectId,
  ).toBeNull();
});

it('keeps a running subject-only session usable after deletion and preserves its next block', async () => {
  const a = await account();
  const subject = (await write('post', '/subjects', a.cookie, input)).body;
  const session = (
    await write('post', '/pomodoro/sessions', a.cookie, {
      subjectId: subject.id,
    })
  ).body;
  expect(session).toMatchObject({ taskId: null, subjectId: subject.id });
  now = new Date(now.getTime() + 120_000);
  await write('delete', '/subjects/' + subject.id, a.cookie);
  const paused = (
    await write(
      'post',
      '/pomodoro/sessions/' + session.id + '/pause',
      a.cookie,
      { version: 0 },
    )
  ).body;
  expect(paused).toMatchObject({
    state: 'PAUSED',
    subjectId: null,
    activeSeconds: 120,
    completedBlocks: 0,
  });
  const resumed = (
    await write(
      'post',
      '/pomodoro/sessions/' + session.id + '/resume',
      a.cookie,
      { version: paused.version },
    )
  ).body;
  now = new Date(now.getTime() + 1_380_000);
  const ended = (
    await write(
      'post',
      '/pomodoro/sessions/' + session.id + '/complete',
      a.cookie,
      { version: resumed.version },
    )
  ).body;
  expect(ended).toMatchObject({
    state: 'COMPLETED',
    subjectId: null,
    activeSeconds: 1500,
    completedBlocks: 1,
  });
});

it('returns batched own progress with manual, roadmap, zero and unavailable values', async () => {
  const owner = await account();
  const other = await account();
  const create = async (cookie: string, name: string) =>
    (await write('post', '/subjects', cookie, { ...input, name })).body
      .id as string;
  const manual = await create(owner.cookie, 'Progresso manual');
  const roadmap = await create(owner.cookie, 'Progresso roadmap');
  const empty = await create(owner.cookie, 'Progresso vazio');
  const zero = await create(owner.cookie, 'Progresso zero');
  await create(other.cookie, 'Progresso alheio');
  const step = await write(
    'post',
    `/subjects/${manual}/plan-items`,
    owner.cookie,
    { title: 'Etapa A' },
  );
  await write('post', `/subjects/${manual}/plan-items`, owner.cookie, {
    title: 'Etapa B',
  });
  await write('post', `/subjects/${zero}/plan-items`, owner.cookie, {
    title: 'Pendente',
  });
  const itemId = step.body.planItems[0].id as string;
  await write(
    'patch',
    `/subjects/${manual}/plan-items/${itemId}`,
    owner.cookie,
    { status: 'COMPLETED' },
  );
  const roadmapId = randomUUID();
  const blockId = randomUUID();
  await source.query(
    'INSERT INTO subject_roadmaps (id,subject_id,title,description) VALUES (?,?,?,?)',
    [roadmapId, roadmap, 'Plano oficial', ''],
  );
  await source.query(
    'INSERT INTO subject_roadmap_blocks (id,roadmap_id,title,description,position) VALUES (?,?,?,?,0)',
    [blockId, roadmapId, 'Bloco', ''],
  );
  await source.query(
    'INSERT INTO subject_roadmap_steps (id,block_id,title,description,position,completed) VALUES (?,?,?,?,0,true),(?,?,?,?,1,false)',
    [randomUUID(), blockId, 'Feito', '', randomUUID(), blockId, 'Pendente', ''],
  );
  const result = await read(
    '/subjects?name=Progresso&pageSize=100',
    owner.cookie,
  );
  expect(result.status).toBe(200);
  expect(result.body.total).toBe(4);
  const summaries = new Map<
    string,
    {
      source: string;
      total: number;
      completed: number;
      progressPercent: number | null;
    }
  >(
    result.body.items.map((item: { id: string; studySummary: unknown }) => [
      item.id,
      item.studySummary,
    ]),
  );
  expect(summaries.get(manual)).toEqual({
    source: 'manual',
    total: 2,
    completed: 1,
    progressPercent: 50,
  });
  expect(summaries.get(roadmap)).toEqual({
    source: 'roadmap',
    total: 2,
    completed: 1,
    progressPercent: 50,
  });
  expect(summaries.get(empty)?.progressPercent).toBeNull();
  expect(summaries.get(zero)?.progressPercent).toBe(0);
  const page = await read(
    '/subjects?name=Progresso&pageSize=1&page=2',
    owner.cookie,
  );
  expect(page.body.items).toHaveLength(1);
  expect(page.body.total).toBe(4);
  expect(page.body.items[0].studySummary).toBeTruthy();
  expect((await read(`/subjects/${manual}`, other.cookie)).status).toBe(404);
  await write(
    'patch',
    `/subjects/${manual}/plan-items/${itemId}`,
    owner.cookie,
    { status: 'PENDING' },
  );
  const updated = await read('/subjects?name=Progresso%20manual', owner.cookie);
  expect(updated.body.items[0].studySummary.progressPercent).toBe(0);
});

it('keeps the list query count constant when the page contains more disciplines', async () => {
  const owner = await account();
  for (let index = 0; index < 4; index++)
    await write('post', '/subjects', owner.cookie, {
      ...input,
      name: `Lote ${index}`,
    });
  const logger = vi.spyOn(source.logger, 'logQuery');
  const repo = new SubjectsRepository(source);
  try {
    await repo.list(owner.id, { page: 1, pageSize: 1 });
    const single = logger.mock.calls.length;
    logger.mockClear();
    const page = await repo.list(owner.id, { page: 1, pageSize: 4 });
    expect(page.items).toHaveLength(4);
    expect(logger.mock.calls.length).toBe(single);
  } finally {
    logger.mockRestore();
  }
});

it('persists minimal subject creation defaults and preserves them in partial edits', async () => {
  const owner = await account();
  const response = await write('post', '/subjects', owner.cookie, {
    name: ' Nova ',
    currentLevel: 'INTERMEDIATE',
    dueDate: '2027-05-20',
  });
  expect(response.status).toBe(201);
  expect(response.body).toMatchObject({
    name: 'Nova',
    objective: 'Estudar e me aprimorar em Nova',
    weeklyHours: 1,
    knownTopics: [],
  });
  const edited = await write(
    'patch',
    `/subjects/${response.body.id}`,
    owner.cookie,
    { name: 'Renomeada' },
  );
  expect(edited.status).toBe(200);
  expect(
    (await read(`/subjects/${response.body.id}`, owner.cookie)).body,
  ).toMatchObject({
    name: 'Renomeada',
    objective: 'Estudar e me aprimorar em Nova',
    weeklyHours: 1,
  });
});
