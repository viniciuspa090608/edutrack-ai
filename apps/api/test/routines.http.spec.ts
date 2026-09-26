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
import { RoutinesService } from '../src/modules/routines/routines.service.js';
import { RoutinesRepository } from '../src/modules/routines/routines.repository.js';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_routine_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
});
const slot = { weekday: 1, startTime: '08:00', endTime: '09:00' };
const input = {
  name: ' Estudo ',
  timeZone: 'America/Sao_Paulo',
  slots: [{ weekday: 3, startTime: '19:00', endTime: '20:30' }, slot],
};
async function account() {
  const uuid = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${uuid}@example.com`,
    uuid,
    `${uuid}@example.com`,
  );
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
it('applies once, reverses routine tables and reapplies without synchronization', async () => {
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  await source.undoLastMigration();
  await expect(source.query('SELECT * FROM study_routines')).rejects.toThrow();
  await expect(
    source.query('SELECT * FROM study_routine_slots'),
  ).rejects.toThrow();
  expect((await source.runMigrations()).length).toBe(1);
});
it('protects every route and write origin and never accepts client ownership', async () => {
  const a = await account();
  for (const path of [
    '/routines',
    '/routines/schedule',
    `/routines/${randomUUID()}`,
  ])
    expect((await request(app).get(path)).status).toBe(401);
  for (const method of ['post', 'patch', 'delete'] as const)
    expect((await request(app)[method]('/routines').send({})).status).toBe(401);
  expect(
    (await request(app).post('/routines').set('Cookie', a.cookie).send(input))
      .status,
  ).toBe(403);
  expect(
    (
      await request(app)
        .post('/routines')
        .set('Cookie', a.cookie)
        .set('Origin', 'https://evil.example')
        .send(input)
    ).status,
  ).toBe(403);
  expect(
    (await write('post', '/routines', a.cookie, { ...input, userId: a.id }))
      .status,
  ).toBe(400);
  expect((await read(`/routines?userId=${a.id}`, a.cookie)).status).toBe(400);
  expect((await read('/routines/not-an-id', a.cookie)).status).toBe(404);
});
it('creates, lists, partially edits and replaces slots while keeping saved wall times', async () => {
  const a = await account();
  const created = await write('post', '/routines', a.cookie, input);
  expect(created.status).toBe(201);
  const row = created.body;
  expect(row.name).toBe('Estudo');
  expect(row).not.toHaveProperty('userId');
  expect(row.slots).toEqual([slot, input.slots[0]]);
  expect((await read(`/routines/${row.id}`, a.cookie)).body).toEqual(row);
  const zone = await write('patch', `/routines/${row.id}`, a.cookie, {
    timeZone: 'Europe/Lisbon',
  });
  expect(zone.status).toBe(200);
  expect(zone.body.slots).toEqual(row.slots);
  expect((await read('/routines/schedule', a.cookie)).body.items).toMatchObject(
    [
      { weekday: 1, startTime: '08:00', timeZone: 'Europe/Lisbon' },
      { weekday: 3, startTime: '19:00', timeZone: 'Europe/Lisbon' },
    ],
  );
  const newSlots = [
    { weekday: 4, startTime: '09:00', endTime: '10:00' },
    { weekday: 4, startTime: '10:00', endTime: '11:00' },
  ];
  const changed = await write('patch', `/routines/${row.id}`, a.cookie, {
    slots: newSlots,
  });
  expect(changed.status).toBe(200);
  expect(changed.body).toMatchObject({
    name: 'Estudo',
    timeZone: 'Europe/Lisbon',
    slots: newSlots,
  });
  expect((await read('/routines', a.cookie)).body.total).toBe(1);
});
it('rejects invalid and overlapping slots in service and HTTP without changing anything', async () => {
  const a = await account();
  const service = new RoutinesService(new RoutinesRepository(source));
  const row = await service.create(a.id, input);
  for (const payload of [
    { name: '', slots: [slot] },
    { timeZone: 'bad' },
    { slots: [] },
    { slots: [slot, { ...slot, startTime: '08:30', endTime: '10:00' }] },
    { slots: [{ ...slot, weekday: 8 }] },
    { slots: [{ ...slot, startTime: '24:00' }] },
    {},
  ]) {
    expect(
      (await write('patch', `/routines/${row.id}`, a.cookie, payload)).status,
    ).toBe(400);
    expect((await read(`/routines/${row.id}`, a.cookie)).body).toEqual(row);
  }
  await expect(
    service.create(a.id, { ...input, slots: [slot, slot] }),
  ).rejects.toMatchObject({ status: 400 });
  const coincident = await service.create(a.id, {
    ...input,
    name: 'Outra',
    slots: [slot],
  });
  expect(coincident.id).not.toBe(row.id);
});
it('rolls back name, zone and full slot replacement after a database failure', async () => {
  const a = await account();
  const service = new RoutinesService(new RoutinesRepository(source));
  const row = await service.create(a.id, input);
  await source.query(
    "CREATE TRIGGER routine_test_failure BEFORE INSERT ON study_routine_slots FOR EACH ROW BEGIN IF NEW.start_time = '13:00' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test failure'; END IF; END",
  );
  try {
    const response = await write('patch', `/routines/${row.id}`, a.cookie, {
      name: 'Novo',
      timeZone: 'UTC',
      slots: [
        slot,
        { ...slot, weekday: 2, startTime: '13:00', endTime: '14:00' },
      ],
    });
    expect(response.status).toBe(500);
    expect(response.body.error).toEqual({
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor.',
    });
    expect(await service.detail(a.id, row.id)).toEqual(row);
  } finally {
    await source.query('DROP TRIGGER routine_test_failure');
  }
});
it('isolates two users, paginates stably and cascades only own routine slots', async () => {
  const a = await account();
  const b = await account();
  let firstId = '';
  for (const owner of [a, b])
    for (const weekday of [7, 2, 1]) {
      const row = (
        await write('post', '/routines', owner.cookie, {
          ...input,
          slots: [{ ...slot, weekday }],
        })
      ).body;
      if (owner === a && !firstId) firstId = row.id;
    }
  for (const method of ['get', 'patch', 'delete'] as const) {
    const response =
      method === 'get'
        ? await read(`/routines/${firstId}`, b.cookie)
        : await write(method, `/routines/${firstId}`, b.cookie, {
            name: 'Ataque',
          });
    expect(response.status).toBe(404);
  }
  expect(
    (await read('/routines/schedule', a.cookie)).body.items.map(
      (item: { weekday: number }) => item.weekday,
    ),
  ).toEqual([1, 2, 7]);
  expect(
    (await read('/routines/schedule', b.cookie)).body.items,
  ).not.toContainEqual(expect.objectContaining({ routineId: firstId }));
  const page1 = (await read('/routines?pageSize=1', a.cookie)).body;
  const page2 = (await read('/routines?pageSize=1&page=2', a.cookie)).body;
  expect(page1.total).toBe(3);
  expect(page1.items[0].id).not.toBe(page2.items[0].id);
  expect((await write('delete', `/routines/${firstId}`, a.cookie)).status).toBe(
    204,
  );
  expect((await read(`/routines/${firstId}`, a.cookie)).status).toBe(404);
  expect(
    await source.query(
      'SELECT id FROM study_routine_slots WHERE routine_id=?',
      [firstId],
    ),
  ).toEqual([]);
  expect((await read('/routines', b.cookie)).body.total).toBe(3);
});
it('works with other modules disabled and writes no tasks or Pomodoro records', async () => {
  const a = await account();
  await new PreferencesService(source).update(a.id, {
    tasks: false,
    subjects: true,
    flashcards: false,
    ai: false,
  });
  const row = (await write('post', '/routines', a.cookie, input)).body;
  expect((await read('/routines/schedule', a.cookie)).body.items.length).toBe(
    2,
  );
  await write('patch', `/routines/${row.id}`, a.cookie, { name: 'Manual' });
  await write('delete', `/routines/${row.id}`, a.cookie);
  for (const table of ['study_tasks', 'pomodoro_sessions'])
    expect(
      await source.query(`SELECT id FROM ${table} WHERE user_id=?`, [a.id]),
    ).toEqual([]);
});
