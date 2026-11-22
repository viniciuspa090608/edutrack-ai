import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { beforeAll, afterAll, beforeEach, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { setInitialCardTime } from './card-time.fixture.js';
import { CreateSubjectGoals20261122100000 } from '../src/database/migrations/20261122100000-CreateSubjectGoals.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_goals_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let now = new Date('2026-11-01T12:00:00Z');
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
  subjectGoalsClock: () => now,
  reviewClock: () => now,
});
const prefs = new PreferencesService(source);
const goal = {
  indicator: 'tasks',
  target: 10,
  dueDate: '2026-11-28',
  timeZone: 'America/Sao_Paulo',
};
const write = (
  method: 'post' | 'put' | 'patch' | 'delete',
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
async function account() {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.com`,
    id,
    `${id}@example.com`,
  );
  return {
    id: user.id,
    cookie: `edutrack_session=${await new SessionRepository(source).create(user.id)}`,
  };
}
async function subject(cookie: string) {
  const response = await write('post', '/subjects', cookie, {
    name: 'Álgebra',
    currentLevel: 'BEGINNER',
    dueDate: '2026-12-01',
  });
  expect(response.status).toBe(201);
  return response.body.id as string;
}
beforeAll(async () => {
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  await source.initialize();
  await source.runMigrations();
});
beforeEach(() => {
  now = new Date('2026-11-01T12:00:00Z');
});
afterAll(async () => {
  if (source.isInitialized) await source.destroy();
  if (admin.isInitialized) {
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.destroy();
  }
});
it('migrates reversibly and persists one goal, preserving its window on edits and resetting on indicator change', async () => {
  const runner = source.createQueryRunner();
  await new CreateSubjectGoals20261122100000().down(runner);
  await new CreateSubjectGoals20261122100000().up(runner);
  await runner.release();
  const a = await account(),
    id = await subject(a.cookie);
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.goal,
  ).toBeNull();
  const saved = await write('put', `/subjects/${id}/goal`, a.cookie, goal);
  expect(saved.status).toBe(200);
  const startedAt = saved.body.goal.startedAt;
  now = new Date('2026-11-22T12:00:00Z');
  const updates = await Promise.all(
    [12, 15].map((target) =>
      write('put', `/subjects/${id}/goal`, a.cookie, { ...goal, target }),
    ),
  );
  expect(updates.map((r) => r.status)).toEqual([200, 200]);
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.goal.startedAt,
  ).toBe(startedAt);
  expect(
    await source.query('SELECT subject_id FROM subject_goals WHERE user_id=?', [
      a.id,
    ]),
  ).toHaveLength(1);
  const changed = await write('put', `/subjects/${id}/goal`, a.cookie, {
    ...goal,
    indicator: 'studyHours',
    target: 2,
  });
  expect(changed.body.goal.startedAt).toBe(now.toISOString());
  await write('delete', `/subjects/${id}`, a.cookie);
  expect(
    await source.query('SELECT subject_id FROM subject_goals WHERE user_id=?', [
      a.id,
    ]),
  ).toHaveLength(0);
});
it('requires auth, authorized origin and ownership and validates goals without writes', async () => {
  const a = await account(),
    b = await account(),
    id = await subject(a.cookie);
  expect((await request(app).get(`/subjects/${id}/insights`)).status).toBe(401);
  expect((await read(`/subjects/${id}/insights`, b.cookie)).status).toBe(404);
  expect(
    (await write('put', `/subjects/${id}/goal`, b.cookie, goal)).status,
  ).toBe(404);
  expect(
    (
      await request(app)
        .put(`/subjects/${id}/goal`)
        .set('Cookie', a.cookie)
        .set('Origin', 'https://invalid.example')
        .send(goal)
    ).status,
  ).toBe(403);
  for (const patch of [
    { target: 1.5 },
    { dueDate: '2026-02-30' },
    { dueDate: '2026-10-31' },
    { indicator: 'reviewAccuracy', target: 101 },
    { userId: b.id },
  ])
    expect(
      (
        await write('put', `/subjects/${id}/goal`, a.cookie, {
          ...goal,
          ...patch,
        })
      ).status,
    ).toBe(400);
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.goal,
  ).toBeNull();
});
it('isolates current tasks and refreshes after completion, reopen, relink, deletion and module changes', async () => {
  const a = await account(),
    b = await account(),
    id = await subject(a.cookie),
    other = await subject(a.cookie),
    foreign = await subject(b.cookie);
  await write('put', `/subjects/${id}/goal`, a.cookie, goal);
  for (const [cookie, subjectId] of [
    [a.cookie, other],
    [b.cookie, foreign],
  ] as const) {
    await write('post', '/tasks', cookie, {
      title: 'Outra',
      subjectId,
      status: 'COMPLETED',
    });
  }
  const task = await write('post', '/tasks', a.cookie, {
    title: 'Estudar',
    subjectId: id,
    dueDate: '2026-11-25',
  });
  now = new Date('2026-11-22T12:00:00Z');
  const before = await read(`/subjects/${id}/insights`, a.cookie);
  expect(before.body.progress).toMatchObject({
    current: 0,
    state: 'no_progress',
  });
  expect(
    before.body.insights.find((i: { code: string }) => i.code === 'due_soon'),
  ).toBeDefined();
  await write('patch', `/tasks/${task.body.id}`, a.cookie, {
    status: 'COMPLETED',
  });
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.progress.current,
  ).toBe(1);
  await write('patch', `/tasks/${task.body.id}`, a.cookie, {
    status: 'PENDING',
  });
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.progress.current,
  ).toBe(0);
  await write('patch', `/tasks/${task.body.id}`, a.cookie, {
    status: 'COMPLETED',
    subjectId: other,
  });
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.progress.current,
  ).toBe(0);
  await write('patch', `/tasks/${task.body.id}`, a.cookie, { subjectId: id });
  await write('delete', `/tasks/${task.body.id}`, a.cookie);
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.progress.state,
  ).toBe('no_data');
  await prefs.update(a.id, { tasks: false });
  const disabled = await read(`/subjects/${id}/insights`, a.cookie);
  expect(disabled.body.progress).toMatchObject({
    state: 'unavailable',
    current: null,
  });
  expect(disabled.body.availableIndicators).not.toContain('tasks');
  expect(
    (await write('put', `/subjects/${id}/goal`, a.cookie, goal)).status,
  ).toBe(403);
  await prefs.update(a.id, { tasks: true, subjects: false });
  expect((await read(`/subjects/${id}/insights`, a.cookie)).status).toBe(403);
});
it('counts only clipped real intervals of owned linked terminal sessions, excluding pauses and running sessions', async () => {
  const a = await account(),
    b = await account(),
    id = await subject(a.cookie),
    other = await subject(a.cookie),
    foreign = await subject(b.cookie);
  await write('put', `/subjects/${id}/goal`, a.cookie, {
    ...goal,
    indicator: 'studyHours',
    target: 2,
  });
  now = new Date('2026-11-02T14:00:00Z');
  for (const [owner, subjectId, state] of [
    [a.id, id, 'COMPLETED'],
    [a.id, other, 'COMPLETED'],
    [b.id, foreign, 'COMPLETED'],
    [a.id, id, 'RUNNING'],
  ] as const) {
    const sessionId = randomUUID();
    await source.query(
      'INSERT INTO pomodoro_sessions(id,user_id,subject_id,state,active_ms,started_at,ended_at) VALUES (?,?,?,?,?,?,?)',
      [
        sessionId,
        owner,
        subjectId,
        state,
        7200000,
        new Date('2026-11-01T11:00:00Z'),
        now,
      ],
    );
    for (const [version, start, end] of [
      [1, '2026-11-01T11:00:00Z', '2026-11-01T12:30:00Z'],
      [2, '2026-11-02T12:00:00Z', '2026-11-02T12:30:00Z'],
    ] as const)
      await source.query(
        'INSERT INTO pomodoro_active_intervals(id,user_id,session_id,started_at,ended_at,source_version) VALUES (?,?,?,?,?,?)',
        [
          randomUUID(),
          owner,
          sessionId,
          new Date(start),
          new Date(end),
          version,
        ],
      );
  }
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.progress,
  ).toMatchObject({ current: 1, percent: 50 });
  await prefs.update(a.id, { pomodoro: false });
  expect(
    (await read(`/subjects/${id}/insights`, a.cookie)).body.progress.state,
  ).toBe('unavailable');
});
it('counts only linked review ratings since goal creation and compares adequate adjacent windows', async () => {
  const a = await account(),
    id = await subject(a.cookie),
    other = await subject(a.cookie);
  await write('put', `/subjects/${id}/goal`, a.cookie, {
    ...goal,
    indicator: 'reviewAccuracy',
    target: 90,
  });
  for (const subjectId of [id, other]) {
    const deck = await write('post', '/flashcard-decks', a.cookie, {
      name: 'Revisões',
      subjectId,
    });
    expect(deck.status).toBe(201);
    for (let index = 0; index < 10; index++) {
      now = new Date(
        index < 5 ? '2026-11-10T12:00:00Z' : '2026-11-20T12:00:00Z',
      );
      const card = await write(
        'post',
        `/flashcard-decks/${deck.body.id}/cards`,
        a.cookie,
        { front: 'Pergunta', back: 'Resposta' },
      );
      await setInitialCardTime(source, card.body.id, now);
      const rating = index < 2 || index >= 6 ? 'GOOD' : 'AGAIN';
      const review = await write(
        'post',
        `/flashcard-decks/${deck.body.id}/cards/${card.body.id}/reviews`,
        a.cookie,
        { rating, expectedRevision: 1, idempotencyKey: randomUUID() },
      );
      expect(review.status).toBe(200);
    }
  }
  now = new Date('2026-11-22T12:00:00Z');
  const result = await read(`/subjects/${id}/insights`, a.cookie);
  expect(result.body.progress.current).toBe(60);
  expect(
    result.body.insights.find(
      (i: { code: string }) => i.code === 'review_trend',
    ).information,
  ).toContain('aumentou');
  await prefs.update(a.id, { flashcards: false });
  const disabled = await read(`/subjects/${id}/insights`, a.cookie);
  expect(disabled.body.progress.state).toBe('unavailable');
  expect(
    disabled.body.insights.find(
      (i: { code: string }) => i.code === 'review_trend',
    ),
  ).toBeUndefined();
});
