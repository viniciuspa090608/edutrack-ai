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
import { PomodoroService } from '../src/modules/pomodoro/pomodoro.service.js';
import { PomodoroRepository } from '../src/modules/pomodoro/pomodoro.repository.js';
import { TasksService } from '../src/modules/tasks/tasks.service.js';
import { TasksRepository } from '../src/modules/tasks/tasks.repository.js';

import { SubjectsService } from '../src/modules/subjects/subjects.service.js';
import { SubjectsRepository } from '../src/modules/subjects/subjects.repository.js';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_pomo_${randomBytes(4).toString('hex')}`;
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
const advance = (minutes: number) => {
  now = new Date(now.getTime() + minutes * 60000);
};
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
const write = (path: string, cookie: string, body: object = {}) =>
  request(app)
    .post(path)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .send(body);
const read = (path: string, cookie: string) =>
  request(app).get(path).set('Cookie', cookie);
const start = (cookie: string, body: object = {}) =>
  write('/pomodoro/sessions', cookie, body);
const command = (
  cookie: string,
  row: { id: string; version: number },
  action: string,
) =>
  write(`/pomodoro/sessions/${row.id}/${action}`, cookie, {
    version: row.version,
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

describe('Pomodoro HTTP on isolated real MySQL', () => {
  it('reexecutes migrations and protects sessions, origin, ownership and server time', async () => {
    expect(await source.runMigrations()).toEqual([]);
    const a = await account();
    const b = await account();
    expect((await request(app).get('/pomodoro/sessions/current')).status).toBe(
      401,
    );
    expect(
      (
        await request(app)
          .post('/pomodoro/sessions')
          .set('Cookie', a.cookie)
          .send({})
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post('/pomodoro/sessions')
          .set('Cookie', a.cookie)
          .set('Origin', 'https://evil.example')
          .send({})
      ).status,
    ).toBe(403);
    for (const body of [
      { userId: a.id },
      { activeSeconds: 1500 },
      { taskId: 'bad' },
    ])
      expect((await start(a.cookie, body)).status).toBe(400);
    const row = (await start(a.cookie)).body;
    expect((await read(`/pomodoro/sessions/${row.id}`, b.cookie)).status).toBe(
      404,
    );
    for (const action of [
      'pause',
      'resume',
      'next-block',
      'complete',
      'cancel',
    ])
      expect((await command(b.cookie, row, action)).status).toBe(404);
    expect((await read('/pomodoro/summary', b.cookie)).body).toEqual({
      activeSeconds: 0,
      completedBlocks: 0,
    });
    expect(
      (
        await write(`/pomodoro/sessions/${row.id}/pause`, a.cookie, {
          version: 0,
          activeSeconds: 600,
        })
      ).status,
    ).toBe(400);
    expect((await read('/pomodoro/sessions?userId=x', a.cookie)).status).toBe(
      400,
    );
  });
  it('serializes simultaneous starts and enforces the database open slot', async () => {
    const a = await account();
    const responses = await Promise.all([start(a.cookie), start(a.cookie)]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    const row = responses.find((r) => r.status === 201)!.body;
    expect(responses.find((r) => r.status === 409)!.body.session.id).toBe(
      row.id,
    );
    expect(
      (await read('/pomodoro/sessions/current', a.cookie)).body.session.id,
    ).toBe(row.id);
    await expect(
      source.query(
        'INSERT INTO pomodoro_open_sessions (user_id,session_id) VALUES (?,?)',
        [a.id, row.id],
      ),
    ).rejects.toThrow();
    expect((await command(a.cookie, row, 'complete')).status).toBe(409);
    expect((await command(a.cookie, row, 'cancel')).status).toBe(200);
    expect((await start(a.cookie)).status).toBe(201);
  });
  it('excludes pauses, stops at boundaries, preserves 35 minutes and one block idempotently', async () => {
    const a = await account();
    let row = (await start(a.cookie)).body;
    advance(10);
    const paused = await command(a.cookie, row, 'pause');
    expect(paused.status).toBe(200);
    row = paused.body;
    expect(row).toMatchObject({
      activeSeconds: 600,
      state: 'PAUSED',
      completedBlocks: 0,
    });
    expect(
      (await command(a.cookie, { ...row, version: 0 }, 'pause')).status,
    ).toBe(409);
    expect((await command(a.cookie, row, 'pause')).status).toBe(409);
    advance(5);
    expect(
      (await read('/pomodoro/sessions/current', a.cookie)).body.session
        .activeSeconds,
    ).toBe(600);
    row = (await command(a.cookie, row, 'resume')).body;
    advance(15);
    row = (await read('/pomodoro/sessions/current', a.cookie)).body.session;
    expect(row).toMatchObject({
      activeSeconds: 1500,
      state: 'BETWEEN_BLOCKS',
      completedBlocks: 1,
    });
    advance(10);
    expect(
      (await read(`/pomodoro/sessions/${row.id}`, a.cookie)).body.activeSeconds,
    ).toBe(1500);
    const next = await Promise.all([
      command(a.cookie, row, 'next-block'),
      command(a.cookie, row, 'next-block'),
    ]);
    expect(next.map((r) => r.status).sort()).toEqual([200, 409]);
    row = next.find((r) => r.status === 200)!.body;
    advance(10);
    expect((await read('/pomodoro/summary', a.cookie)).body.activeSeconds).toBe(
      0,
    );
    const completed = await command(a.cookie, row, 'complete');
    expect(completed.status).toBe(200);
    expect(completed.body).toMatchObject({
      activeSeconds: 2100,
      completedBlocks: 1,
      state: 'COMPLETED',
    });
    advance(50);
    const repeated = await command(a.cookie, row, 'complete');
    expect(repeated.status).toBe(200);
    expect(repeated.body.activeSeconds).toBe(2100);
    expect(repeated.body.version).toBe(completed.body.version);
    expect(
      (await read('/pomodoro/sessions/current', a.cookie)).body.session,
    ).toBeNull();
    expect((await read('/pomodoro/summary', a.cookie)).body).toEqual({
      activeSeconds: 2100,
      completedBlocks: 1,
    });
  });
  it('credits 50 minutes in two blocks and preserves cancelations before and after a block', async () => {
    const a = await account();
    let row = (await start(a.cookie)).body;
    advance(25);
    row = (await read('/pomodoro/sessions/current', a.cookie)).body.session;
    row = (await command(a.cookie, row, 'next-block')).body;
    advance(30);
    const done = await command(a.cookie, row, 'complete');
    expect(done.status).toBe(200);
    expect(done.body).toMatchObject({
      activeSeconds: 3000,
      completedBlocks: 2,
    });
    row = (await start(a.cookie)).body;
    advance(10);
    row = (await command(a.cookie, row, 'pause')).body;
    advance(5);
    const canceled = await command(a.cookie, row, 'cancel');
    expect(canceled.body).toMatchObject({
      activeSeconds: 600,
      completedBlocks: 0,
      state: 'CANCELED',
    });
    expect((await command(a.cookie, row, 'cancel')).body.version).toBe(
      canceled.body.version,
    );
    expect((await command(a.cookie, canceled.body, 'resume')).status).toBe(409);
    row = (await start(a.cookie)).body;
    advance(25);
    row = (await command(a.cookie, row, 'next-block')).body;
    advance(10);
    row = (await command(a.cookie, row, 'cancel')).body;
    expect(row).toMatchObject({ activeSeconds: 2100, completedBlocks: 1 });
    expect((await read('/pomodoro/summary', a.cookie)).body).toEqual({
      activeSeconds: 5700,
      completedBlocks: 3,
    });
    const page1 = (await read('/pomodoro/sessions?pageSize=1', a.cookie)).body;
    const page2 = (await read('/pomodoro/sessions?pageSize=1&page=2', a.cookie))
      .body;
    expect(page1.total).toBe(3);
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });
  it('validates public task ownership and preferences and preserves history on deletion including a race', async () => {
    const a = await account();
    const b = await account();
    const task = (await write('/tasks', a.cookie, { title: 'Estudo' })).body;
    expect((await start(b.cookie, { taskId: task.id })).status).toBe(404);
    expect((await start(a.cookie, { taskId: randomUUID() })).status).toBe(404);
    await new PreferencesService(source).update(a.id, { tasks: false });
    expect((await start(a.cookie, { taskId: task.id })).status).toBe(403);
    let row = (await start(a.cookie)).body;
    expect((await command(a.cookie, row, 'cancel')).status).toBe(200);
    await new PreferencesService(source).update(a.id, { tasks: true });
    row = (await start(a.cookie, { taskId: task.id })).body;
    advance(25);
    row = (await command(a.cookie, row, 'complete')).body;
    expect((await read(`/tasks/${task.id}`, a.cookie)).body.status).toBe(
      'PENDING',
    );
    await request(app)
      .delete(`/tasks/${task.id}`)
      .set('Cookie', a.cookie)
      .set('Origin', env.WEB_ORIGIN)
      .send({})
      .expect(204);
    expect(
      (await read(`/pomodoro/sessions/${row.id}`, a.cookie)).body,
    ).toMatchObject({ taskId: null, activeSeconds: 1500, completedBlocks: 1 });
    const racingTask = (await write('/tasks', a.cookie, { title: 'Excluir' }))
      .body;
    const tasks = new TasksService(
      new TasksRepository(source),
      new SubjectsService(
        new SubjectsRepository(source),
        new PreferencesService(source),
      ),
    );
    const service = new PomodoroService(
      new PomodoroRepository(source),
      {
        detail: async (owner, id) => {
          const value = await tasks.detail(owner, id);
          await tasks.delete(owner, id);
          return value;
        },
      },
      new PreferencesService(source),
      new SubjectsService(
        new SubjectsRepository(source),
        new PreferencesService(source),
      ),
    );
    await expect(
      service.start(a.id, { taskId: racingTask.id }),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      (await read('/pomodoro/sessions/current', a.cookie)).body.session,
    ).toBeNull();
    expect((await read('/pomodoro/summary', a.cookie)).body).toEqual({
      activeSeconds: 1500,
      completedBlocks: 1,
    });
  });
  it('uses the database UTC clock in production and persists across repository recreation', async () => {
    const a = await account();
    const tasks = new TasksService(
      new TasksRepository(source),
      new SubjectsService(
        new SubjectsRepository(source),
        new PreferencesService(source),
      ),
    );
    const prefs = new PreferencesService(source);
    const service = new PomodoroService(
      new PomodoroRepository(source),
      tasks,
      prefs,
      new SubjectsService(new SubjectsRepository(source), prefs),
    );
    const row = await service.start(a.id, {});
    expect(Math.abs(Date.parse(row.serverTime) - Date.now())).toBeLessThan(
      5000,
    );
    const recreated = new PomodoroService(
      new PomodoroRepository(source),
      tasks,
      prefs,
      new SubjectsService(new SubjectsRepository(source), prefs),
    );
    expect((await recreated.current(a.id)).session?.id).toBe(row.id);
  });
});
