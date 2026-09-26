import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import type { SubtasksResponse } from '@study-platform/contracts';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_subtasks_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
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
async function account() {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.com`,
    id,
    `${id}@example.com`,
  );
  const token = await new SessionRepository(source).create(user.id);
  return { id: user.id, cookie: `edutrack_session=${token}` };
}
function call(
  method: 'get' | 'post' | 'patch' | 'delete' | 'put',
  path: string,
  cookie: string,
  body?: object,
) {
  const result = request(app)
    [method](path)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN);
  return method === 'get' ? result : result.send(body ?? {});
}
async function task(cookie: string, status = 'PENDING') {
  const res = await call('post', '/tasks', cookie, { title: 'Prova', status });
  expect(res.status).toBe(201);
  return res.body.id as string;
}
async function add(cookie: string, taskId: string, title = 'Passo') {
  const res = await call('post', `/tasks/${taskId}/subtasks`, cookie, {
    title,
  });
  expect(res.status).toBe(201);
  return res.body as SubtasksResponse;
}
async function state(cookie: string, id: string) {
  const res = await call('get', `/tasks/${id}/subtasks`, cookie);
  expect(res.status).toBe(200);
  return res.body as SubtasksResponse;
}
function coherent(value: SubtasksResponse) {
  const completed = value.items.filter((item) => item.isCompleted).length;
  expect(value.task.subtaskTotal).toBe(value.items.length);
  expect(value.task.subtaskCompleted).toBe(completed);
  expect(value.task.progressPercent).toBe(
    value.items.length ? (completed / value.items.length) * 100 : null,
  );
  if (value.items.length)
    expect(value.task.status).toBe(
      completed === 0
        ? 'PENDING'
        : completed === value.items.length
          ? 'COMPLETED'
          : 'IN_PROGRESS',
    );
  expect(value.items.map((item) => item.position)).toEqual(
    value.items.map((_, index) => index),
  );
}
it('creates and edits pending steps, derives 0/25/100%, filters, reopens and preserves manual status after the last removal', async () => {
  const a = await account();
  const id = await task(a.cookie, 'COMPLETED');
  expect((await state(a.cookie, id)).task.progressPercent).toBeNull();
  let current = await add(a.cookie, id, '  Primeiro  ');
  expect(current.items[0]!.title).toBe('Primeiro');
  expect(current.task.status).toBe('PENDING');
  for (let i = 0; i < 3; i++)
    current = await add(a.cookie, id, `Passo ${i + 2}`);
  const first = current.items[0]!.id;
  current = (
    await call('patch', `/tasks/${id}/subtasks/${first}`, a.cookie, {
      title: 'Editado',
      isCompleted: true,
    })
  ).body;
  expect(current.task).toMatchObject({
    subtaskTotal: 4,
    subtaskCompleted: 1,
    progressPercent: 25,
    status: 'IN_PROGRESS',
  });
  const list = await call('get', '/tasks?status=IN_PROGRESS', a.cookie);
  expect(list.body.items[0].progressPercent).toBe(25);
  expect((await call('get', `/tasks/${id}`, a.cookie)).body).toEqual(
    current.task,
  );
  for (const item of current.items)
    current = (
      await call('patch', `/tasks/${id}/subtasks/${item.id}`, a.cookie, {
        isCompleted: true,
      })
    ).body;
  expect(current.task.progressPercent).toBe(100);
  const duplicate = await call(
    'patch',
    `/tasks/${id}/subtasks/${first}`,
    a.cookie,
    { isCompleted: true },
  );
  expect(duplicate.body).toEqual(current);
  current = (
    await call('patch', `/tasks/${id}/subtasks/${first}`, a.cookie, {
      isCompleted: false,
    })
  ).body;
  expect(current.task.progressPercent).toBe(75);
  for (const item of current.items)
    current = (
      await call('delete', `/tasks/${id}/subtasks/${item.id}`, a.cookie)
    ).body;
  expect(current.task).toMatchObject({
    subtaskTotal: 0,
    subtaskCompleted: 0,
    progressPercent: null,
    status: 'COMPLETED',
  });
  expect(
    (await call('patch', `/tasks/${id}`, a.cookie, { status: 'IN_PROGRESS' }))
      .body.status,
  ).toBe('IN_PROGRESS');
});
it('persists full ordering, compacts removals and rejects invalid sets atomically', async () => {
  const a = await account();
  const id = await task(a.cookie);
  await add(a.cookie, id, 'A');
  await add(a.cookie, id, 'B');
  let current = await add(a.cookie, id, 'C');
  const ids = current.items.map((item) => item.id);
  const ordered = [ids[2]!, ids[0]!, ids[1]!];
  expect(
    (
      await call('put', `/tasks/${id}/subtasks/order`, a.cookie, {
        ids: ordered,
      })
    ).status,
  ).toBe(200);
  current = await state(a.cookie, id);
  expect(current.items.map((item) => item.id)).toEqual(ordered);
  coherent(current);
  for (const invalid of [
    [ids[0]!, ids[0]!, ids[1]!],
    [ids[0]!],
    [],
    [randomUUID(), ids[0]!, ids[1]!],
  ]) {
    expect([400, 404]).toContain(
      (
        await call('put', `/tasks/${id}/subtasks/order`, a.cookie, {
          ids: invalid,
        })
      ).status,
    );
    expect((await state(a.cookie, id)).items.map((item) => item.id)).toEqual(
      ordered,
    );
  }
  current = (await call('delete', `/tasks/${id}/subtasks/${ids[0]}`, a.cookie))
    .body;
  coherent(current);
  expect(current.items.map((item) => item.title)).toEqual(['C', 'B']);
  current = await add(a.cookie, id, 'D');
  expect(current.items.at(-1)!.position).toBe(2);
});
it('rejects all cross-owner and cross-task IDs without exposing or changing records', async () => {
  const a = await account();
  const b = await account();
  const id = await task(a.cookie);
  const other = await task(a.cookie);
  const before = await add(a.cookie, id);
  const subId = before.items[0]!.id;
  for (const [method, path, body] of [
    ['get', `/tasks/${id}/subtasks`, {}],
    ['post', `/tasks/${id}/subtasks`, { title: 'Ataque' }],
    ['patch', `/tasks/${id}/subtasks/${subId}`, { isCompleted: true }],
    ['delete', `/tasks/${id}/subtasks/${subId}`, {}],
    ['put', `/tasks/${id}/subtasks/order`, { ids: [subId] }],
    ['post', `/tasks/${id}/complete-subtasks`, { confirm: true }],
  ] as const)
    expect((await call(method, path, b.cookie, body)).status).toBe(404);
  for (const method of ['patch', 'delete'] as const)
    expect(
      (
        await call(method, `/tasks/${other}/subtasks/${subId}`, a.cookie, {
          isCompleted: true,
        })
      ).status,
    ).toBe(404);
  expect(
    (
      await call('put', `/tasks/${other}/subtasks/order`, a.cookie, {
        ids: [subId],
      })
    ).status,
  ).toBe(404);
  expect(await state(a.cookie, id)).toEqual(before);
  expect((await request(app).get(`/tasks/${id}/subtasks`)).status).toBe(401);
  expect(
    (
      await request(app)
        .post(`/tasks/${id}/subtasks`)
        .set('Cookie', a.cookie)
        .send({ title: 'a' })
    ).status,
  ).toBe(403);
});
it('validates titles, partial patches, unknown fields and explicit confirmation', async () => {
  const a = await account();
  const id = await task(a.cookie);
  const value = await add(a.cookie, id);
  const subId = value.items[0]!.id;
  for (const body of [
    { title: ' ' },
    { title: 'a'.repeat(161) },
    { title: 'a', position: 0 },
  ])
    expect(
      (await call('post', `/tasks/${id}/subtasks`, a.cookie, body)).status,
    ).toBe(400);
  for (const body of [
    {},
    { title: '' },
    { isCompleted: 1 },
    { position: 1 },
    { id: randomUUID() },
  ])
    expect(
      (await call('patch', `/tasks/${id}/subtasks/${subId}`, a.cookie, body))
        .status,
    ).toBe(400);
  for (const body of [
    {},
    { confirm: false },
    { confirm: 'true' },
    { confirm: true, unknown: true },
  ])
    expect(
      (await call('post', `/tasks/${id}/complete-subtasks`, a.cookie, body))
        .body.error.code,
    ).toBe('SUBTASK_CONFIRMATION_REQUIRED');
  expect(await state(a.cookie, id)).toEqual(value);
});
it('blocks incompatible parent status and rolls back mixed payloads before any field mutation', async () => {
  const a = await account();
  const id = await task(a.cookie);
  const before = await add(a.cookie, id);
  for (const status of ['PENDING', 'IN_PROGRESS', 'COMPLETED']) {
    const res = await call('patch', `/tasks/${id}`, a.cookie, {
      title: 'Não salvar',
      description: 'Não salvar',
      status,
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(
      status === 'COMPLETED'
        ? 'SUBTASK_CONFIRMATION_REQUIRED'
        : 'TASK_STATUS_DERIVED',
    );
    expect(await state(a.cookie, id)).toEqual(before);
  }
  expect(
    (await call('patch', `/tasks/${id}`, a.cookie, { title: 'Pode editar' }))
      .body.title,
  ).toBe('Pode editar');
  const complete = await call(
    'post',
    `/tasks/${id}/complete-subtasks`,
    a.cookie,
    { confirm: true },
  );
  expect(complete.status).toBe(200);
  coherent(complete.body);
  expect(complete.body.task.progressPercent).toBe(100);
  expect(
    (
      await call('post', `/tasks/${id}/complete-subtasks`, a.cookie, {
        confirm: true,
      })
    ).body,
  ).toEqual(complete.body);
  expect(
    (await call('patch', `/tasks/${id}`, a.cookie, { status: 'COMPLETED' }))
      .body,
  ).toEqual(complete.body.task);
});
it('rolls back all pending completions if the parent update fails', async () => {
  const a = await account();
  const id = await task(a.cookie);
  const before = await add(a.cookie, id);
  await source.query(
    `CREATE TRIGGER subtasks_atomicity_probe BEFORE UPDATE ON study_tasks FOR EACH ROW BEGIN IF NEW.id = '${id}' AND NEW.status = 'COMPLETED' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Test rollback'; END IF; END`,
  );
  try {
    expect(
      (
        await call('post', `/tasks/${id}/complete-subtasks`, a.cookie, {
          confirm: true,
        })
      ).status,
    ).toBe(500);
    expect(await state(a.cookie, id)).toEqual(before);
  } finally {
    await source.query('DROP TRIGGER subtasks_atomicity_probe');
  }
});
it('serializes concurrent completion/reopening/creation/order and returns coherent final state', async () => {
  const a = await account();
  const id = await task(a.cookie);
  let initial = await add(a.cookie, id, 'A');
  initial = await add(a.cookie, id, 'B');
  const subId = initial.items[0]!.id;
  const operations = await Promise.all([
    call('post', `/tasks/${id}/complete-subtasks`, a.cookie, { confirm: true }),
    call('patch', `/tasks/${id}/subtasks/${subId}`, a.cookie, {
      isCompleted: false,
    }),
    call('post', `/tasks/${id}/subtasks`, a.cookie, { title: 'C' }),
    call('post', `/tasks/${id}/subtasks`, a.cookie, { title: 'D' }),
  ]);
  operations.forEach((result) => {
    expect([200, 201]).toContain(result.status);
    coherent(result.body);
  });
  const current = await state(a.cookie, id);
  coherent(current);
  expect(current.items).toHaveLength(4);
  const ids = current.items.map((item) => item.id);
  const orders = await Promise.all([
    call('put', `/tasks/${id}/subtasks/order`, a.cookie, {
      ids: [...ids].reverse(),
    }),
    call('put', `/tasks/${id}/subtasks/order`, a.cookie, { ids }),
  ]);
  orders.forEach((result) => expect(result.status).toBe(200));
  coherent(await state(a.cookie, id));
  const stored = await source.query(
    'SELECT status FROM study_tasks WHERE id = ? AND user_id = ?',
    [id, a.id],
  );
  expect(stored[0].status).toBe((await state(a.cookie, id)).task.status);
});
