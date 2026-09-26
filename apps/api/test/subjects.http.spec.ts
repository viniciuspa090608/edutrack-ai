import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { beforeAll, afterAll, expect, it } from 'vitest';
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
