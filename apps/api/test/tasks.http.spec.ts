import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_tasks_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
});
async function account() {
  const uuid = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${uuid}@example.com`,
    uuid,
    `${uuid}@example.com`,
  );
  const token = await new SessionRepository(source).create(user.id);
  return { ...user, cookie: `edutrack_session=${token}` };
}
const write = (
  method: 'post' | 'patch' | 'delete',
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

describe('study tasks HTTP on real MySQL', () => {
  it('requires real sessions and protects writes with origin and module preferences', async () => {
    const a = await account();
    for (const method of ['get', 'post', 'patch', 'delete'] as const)
      expect(
        (
          await request(app)
            [method](
              `/tasks${method === 'patch' || method === 'delete' ? `/${randomUUID()}` : ''}`,
            )
            .send({})
        ).status,
      ).toBe(401);
    expect((await read('/tasks', a.cookie)).body).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    });
    expect(
      (
        await request(app)
          .post('/tasks')
          .set('Cookie', a.cookie)
          .send({ title: 'a' })
      ).status,
    ).toBe(403);
    await new PreferencesService(source).update(a.id, { tasks: false });
    for (const method of ['get', 'post', 'patch', 'delete'] as const)
      expect(
        (
          await request(app)
            [method]('/tasks')
            .set('Cookie', a.cookie)
            .set('Origin', env.WEB_ORIGIN)
            .send({})
        ).body.error.code,
      ).toBe('MODULE_DISABLED');
    await new PreferencesService(source).update(a.id, {
      tasks: true,
      ai: false,
    });
    expect(
      (await write('post', '/tasks', a.cookie, { title: 'Sem IA' })).status,
    ).toBe(201);
  });
  it('creates, details, partially edits, manually transitions, clears and deletes own tasks', async () => {
    const a = await account();
    const minimal = await write('post', '/tasks', a.cookie, {
      title: '  Revisar  ',
    });
    expect(minimal.status).toBe(201);
    expect(minimal.body).toMatchObject({
      title: 'Revisar',
      priority: 'MEDIUM',
      status: 'PENDING',
      description: null,
      dueDate: null,
    });
    expect(minimal.body).not.toHaveProperty('userId');
    const created = await write('post', '/tasks', a.cookie, {
      title: 'Prova',
      description: 'Capítulo 1',
      priority: 'HIGH',
      dueDate: '2024-02-29',
    });
    expect(created.status).toBe(201);
    const path = `/tasks/${created.body.id}`;
    expect((await read(path, a.cookie)).body).toEqual(created.body);
    const changed = await write('patch', path, a.cookie, {
      title: '  Prova final ',
      dueDate: '2026-10-01',
    });
    expect(changed.status).toBe(200);
    expect(changed.body).toMatchObject({
      title: 'Prova final',
      dueDate: '2026-10-01',
      description: 'Capítulo 1',
      priority: 'HIGH',
      status: 'PENDING',
    });
    for (const status of ['IN_PROGRESS', 'COMPLETED', 'PENDING'])
      expect(
        (await write('patch', path, a.cookie, { status })).body.status,
      ).toBe(status);
    expect(
      (
        await write('patch', path, a.cookie, {
          description: null,
          dueDate: null,
        })
      ).body,
    ).toMatchObject({ description: null, dueDate: null });
    expect(
      (await write('patch', path, a.cookie, { status: 'PENDING' })).status,
    ).toBe(200);
    expect((await write('delete', path, a.cookie)).status).toBe(204);
    expect((await read(path, a.cookie)).status).toBe(404);
    expect((await write('delete', path, a.cookie)).status).toBe(404);
  });
  it('isolates both owners in every read/mutation and rejects forged ownership', async () => {
    const a = await account();
    const b = await account();
    const task = (await write('post', '/tasks', a.cookie, { title: 'Privada' }))
      .body;
    const path = `/tasks/${task.id}`;
    expect((await read('/tasks', b.cookie)).body.items).toEqual([]);
    expect((await read(path, b.cookie)).status).toBe(404);
    expect(
      (await write('patch', path, b.cookie, { title: 'Ataque' })).status,
    ).toBe(404);
    expect((await write('delete', path, b.cookie)).status).toBe(404);
    expect((await read(path, a.cookie)).body).toEqual(task);
    expect(
      (
        await write('post', '/tasks', b.cookie, {
          title: 'Forjada',
          userId: a.id,
        })
      ).status,
    ).toBe(400);
    expect((await read(`/tasks?userId=${a.id}`, b.cookie)).status).toBe(400);
    expect(
      (await write('patch', path, a.cookie, { userId: b.id })).status,
    ).toBe(400);
  });
  it('rejects invalid mutations without partial persistence', async () => {
    const a = await account();
    for (const body of [
      { title: ' ' },
      { title: 'a'.repeat(161) },
      { title: 'a', description: 'a'.repeat(2001) },
      { title: 'a', priority: 'bad' },
      { title: 'a', status: 'bad' },
      { title: 'a', dueDate: '2026-02-29' },
      { title: 'a', extra: true },
    ])
      expect((await write('post', '/tasks', a.cookie, body)).status).toBe(400);
    expect((await read('/tasks', a.cookie)).body.total).toBe(0);
    const task = (await write('post', '/tasks', a.cookie, { title: 'Intacta' }))
      .body;
    for (const body of [
      {},
      { title: '' },
      { dueDate: 'invalid' },
      { status: 'bad' },
      { priority: null },
    ])
      expect(
        (await write('patch', `/tasks/${task.id}`, a.cookie, body)).status,
      ).toBe(400);
    expect((await read(`/tasks/${task.id}`, a.cookie)).body).toEqual(task);
    expect((await read('/tasks/not-an-id', a.cookie)).status).toBe(404);
  });
  it('combines inclusive filters, excludes undated tasks and paginates stably', async () => {
    const a = await account();
    const b = await account();
    for (const owner of [a, b])
      for (const dueDate of [null, '2026-09-01', '2026-09-30', '2026-10-01'])
        await write('post', '/tasks', owner.cookie, {
          title: dueDate ?? 'Sem prazo',
          dueDate,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
        });
    await write('post', '/tasks', a.cookie, {
      title: 'Outra',
      priority: 'LOW',
      dueDate: '2026-09-01',
    });
    const filter =
      'status=IN_PROGRESS&priority=HIGH&dueFrom=2026-09-01&dueTo=2026-09-30';
    const result = (await read(`/tasks?${filter}`, a.cookie)).body;
    expect(result.total).toBe(2);
    expect(
      result.items.map((item: { dueDate: string }) => item.dueDate).sort(),
    ).toEqual(['2026-09-01', '2026-09-30']);
    expect((await read('/tasks?dueFrom=2026-09-30', a.cookie)).body.total).toBe(
      2,
    );
    expect((await read('/tasks?dueTo=2026-09-01', a.cookie)).body.total).toBe(
      2,
    );
    // Force equal timestamps to verify the ID tie breaker.
    await source.query(
      "UPDATE study_tasks SET created_at = '2026-09-26 12:00:00' WHERE user_id = ?",
      [a.id],
    );
    const first = (await read(`/tasks?${filter}&pageSize=1`, a.cookie)).body;
    const second = (await read(`/tasks?${filter}&pageSize=1&page=2`, a.cookie))
      .body;
    expect(first.totalPages).toBe(2);
    expect(first.items[0].id > second.items[0].id).toBe(true);
    expect(
      (await read(`/tasks?${filter}&pageSize=1&page=3`, a.cookie)).body.items,
    ).toEqual([]);
    for (const query of [
      'status=bad',
      'priority=bad',
      'dueFrom=2026-02-29',
      'dueFrom=2026-09-30&dueTo=2026-09-01',
      'page=0',
      'pageSize=101',
      'status=PENDING&status=COMPLETED',
    ])
      expect((await read(`/tasks?${query}`, a.cookie)).status).toBe(400);
  });
});
