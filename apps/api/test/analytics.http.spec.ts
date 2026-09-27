import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { AnalyticsService } from '../src/modules/analytics/analytics.service.js';
import { publishActivity } from '../src/modules/analytics/activity-publisher.js';
import { SubjectsService } from '../src/modules/subjects/subjects.service.js';
import { SubjectsRepository } from '../src/modules/subjects/subjects.repository.js';
import { studyAnalyticsSchema } from '@study-platform/contracts';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_analytics_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let now = new Date('2026-10-01T23:50:00Z');
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
  pomodoroClock: async () => now,
  reviewClock: () => now,
});
const prefs = new PreferencesService(source);
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
  await source.query("UPDATE users SET created_at='2020-01-01' WHERE id=?", [
    user.id,
  ]);
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
async function count(userId: string, kind: string) {
  const rows = await source.query<Array<{ total: number }>>(
    'SELECT COUNT(*) total FROM study_activity_events WHERE user_id=? AND kind=?',
    [userId, kind],
  );
  return Number(rows[0]!.total);
}
async function reviewed(a: Awaited<ReturnType<typeof account>>) {
  const deck = await write('post', '/flashcard-decks', a.cookie, {
    name: 'Estudo',
  });
  expect(deck.status).toBe(201);
  const card = await write(
    'post',
    `/flashcard-decks/${deck.body.id}/cards`,
    a.cookie,
    { front: 'P', back: 'R' },
  );
  expect(card.status).toBe(201);
  const path = `/flashcard-decks/${deck.body.id}/cards/${card.body.id}`;
  await read(path, a.cookie);
  expect(await count(a.id, 'FLASHCARD_REVIEWED')).toBe(0);
  const body = {
    rating: 'GOOD',
    expectedRevision: 1,
    idempotencyKey: randomUUID(),
  };
  expect((await write('post', `${path}/reviews`, a.cookie, body)).status).toBe(
    200,
  );
  expect(
    (await write('post', `${path}/reviews`, a.cookie, body)).status,
  ).toBeLessThan(300);
  return { deckId: deck.body.id as string };
}
it('rolls back and reapplies in MySQL, backfills only reliable timestamps', async () => {
  const a = await account();
  await reviewed(a);
  await source.query(
    "INSERT INTO pomodoro_sessions (id,user_id,state,active_ms,completed_blocks,started_at,ended_at) VALUES (?,?,'COMPLETED',1500000,1,'2025-01-01','2025-01-01 00:25:00')",
    [randomUUID(), a.id],
  );
  const task = await write('post', '/tasks', a.cookie, {
    title: 'Antiga',
    status: 'COMPLETED',
  });
  expect(task.status).toBe(201);
  await source.query(
    "UPDATE study_tasks SET updated_at='2025-01-01' WHERE id=?",
    [task.body.id],
  );
  expect(source.options.synchronize).toBe(false);
  const later =
    source.migrations.length -
    source.migrations.findIndex((migration) =>
      migration.constructor.name.startsWith('CreateStudyAnalytics'),
    ) -
    1;
  for (let i = 0; i <= later; i++) await source.undoLastMigration();
  expect(
    await source.query("SHOW TABLES LIKE 'study_activity_events'"),
  ).toEqual([]);
  expect(
    (
      await source.query('SELECT id FROM study_tasks WHERE id=?', [
        task.body.id,
      ])
    ).length,
  ).toBe(1);
  expect(await source.runMigrations()).toHaveLength(later + 1);
  expect(await source.runMigrations()).toHaveLength(0);
  expect(await count(a.id, 'FLASHCARD_REVIEWED')).toBe(1);
  expect(await count(a.id, 'POMODORO_SESSION_COMPLETED')).toBe(1);
  expect(await count(a.id, 'TASK_COMPLETED')).toBe(0);
  expect(await source.query('SELECT * FROM pomodoro_active_intervals')).toEqual(
    [],
  );
  const unavailable = await new AnalyticsService(source, prefs).read(a.id, {
    date: '2025-01-01',
    granularity: 'day',
    timeZone: 'UTC',
  });
  expect(unavailable.metrics.tasks!.currentStatus).toBe('history_unavailable');
  expect(unavailable.metrics.activeMs!.current).toBeNull();
  expect(unavailable.series[0]!.values.pomodoroSessions).toBe(1);
  await source.query(
    "UPDATE study_analytics_coverage SET started_at='2020-01-01'",
  );
});
it('records task and subtask transitions once and retains deleted origins', async () => {
  const a = await account();
  const task = (await write('post', '/tasks', a.cookie, { title: 'Estudar' }))
    .body;
  const path = `/tasks/${task.id}`;
  for (const status of ['COMPLETED', 'COMPLETED', 'PENDING', 'COMPLETED'])
    expect((await write('patch', path, a.cookie, { status })).status).toBe(200);
  expect(await count(a.id, 'TASK_COMPLETED')).toBe(2);
  const sub = (
    await write('post', `${path}/subtasks`, a.cookie, { title: 'Ler' })
  ).body.items[0];
  for (const isCompleted of [true, true, false, true])
    expect(
      (
        await write('patch', `${path}/subtasks/${sub.id}`, a.cookie, {
          isCompleted,
        })
      ).status,
    ).toBe(200);
  expect(await count(a.id, 'TASK_COMPLETED')).toBe(4);
  expect((await write('delete', path, a.cookie)).status).toBe(204);
  expect(await count(a.id, 'TASK_COMPLETED')).toBe(4);
  await expect(
    source.transaction(async (manager) => {
      await publishActivity(
        manager,
        a.id,
        'TASK_COMPLETED',
        'task',
        randomUUID(),
      );
      throw new Error('rollback');
    }),
  ).rejects.toThrow('rollback');
  expect(await count(a.id, 'TASK_COMPLETED')).toBe(4);
});
it('records manual items separately from explicit block progress and ignores edits/restorations', async () => {
  const a = await account();
  const subject = await write('post', '/subjects', a.cookie, {
    name: 'Matemática',
    currentLevel: 'BEGINNER',
    objective: 'Estudar',
    dueDate: '2027-01-01',
    weeklyHours: 2,
    knownTopics: [],
  });
  expect(subject.status).toBe(201);
  const path = `/subjects/${subject.body.id}`;
  const item = (
    await write('post', `${path}/plan-items`, a.cookie, { title: 'Ler' })
  ).body.planItems[0];
  for (const status of ['COMPLETED', 'COMPLETED', 'PENDING', 'COMPLETED'])
    expect(
      (
        await write('patch', `${path}/plan-items/${item.id}`, a.cookie, {
          status,
        })
      ).status,
    ).toBe(200);
  const draft = {
    title: 'Plano',
    description: 'Estudo',
    blocks: [
      {
        title: 'Base',
        description: 'Estudo',
        steps: [
          { title: 'Um', description: 'Estudo' },
          { title: 'Dois', description: 'Estudo' },
        ],
      },
    ],
  };
  let roadmap = (await write('post', `${path}/roadmaps`, a.cookie, draft)).body;
  const roadmapPath = `${path}/roadmaps/${roadmap.id}`;
  const progress = async (index: number, completed: boolean) => {
    const response = await write(
      'patch',
      `${roadmapPath}/steps/${roadmap.blocks[0].steps[index].id}`,
      a.cookie,
      { baseRevision: roadmap.revision, completed },
    );
    expect(response.status).toBe(200);
    roadmap = response.body;
  };
  await progress(0, true);
  expect(await count(a.id, 'ROADMAP_BLOCK_COMPLETED')).toBe(0);
  await progress(1, true);
  await progress(1, true);
  expect(await count(a.id, 'ROADMAP_BLOCK_COMPLETED')).toBe(1);
  await progress(1, false);
  await progress(1, true);
  expect(await count(a.id, 'ROADMAP_BLOCK_COMPLETED')).toBe(2);
  const edit = await write('patch', roadmapPath, a.cookie, {
    ...roadmap,
    id: undefined,
    subjectId: undefined,
    revision: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    baseRevision: roadmap.revision,
    title: 'Renomeado',
  });
  expect(edit.status).toBe(200);
  await new SubjectsService(
    new SubjectsRepository(source),
    prefs,
  ).confirmRoadmapRevision(
    a.id,
    subject.body.id,
    roadmap.id,
    edit.body.revision,
    randomUUID(),
    'restauracao',
    1,
    (current) => ({
      title: current.title,
      description: current.description,
      blocks: current.blocks,
    }),
  );
  expect(await count(a.id, 'ROADMAP_BLOCK_COMPLETED')).toBe(2);
  expect(await count(a.id, 'SUBJECT_PLAN_ITEM_COMPLETED')).toBe(2);
  await write('delete', path, a.cookie);
  expect(await count(a.id, 'ROADMAP_BLOCK_COMPLETED')).toBe(2);
});
it('preserves review activity after source deletion and idempotent retries', async () => {
  const a = await account();
  const deck = await reviewed(a);
  expect(await count(a.id, 'FLASHCARD_REVIEWED')).toBe(1);
  await write('delete', `/flashcard-decks/${deck.deckId}`, a.cookie);
  expect(await count(a.id, 'FLASHCARD_REVIEWED')).toBe(1);
});
it('splits actual terminal Pomodoro intervals at midnight, excludes pauses/open sessions and preserves active_ms', async () => {
  const a = await account();
  now = new Date('2026-10-01T23:50:00Z');
  let session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  const command = async (action: string) => {
    const result = await write(
      'post',
      `/pomodoro/sessions/${session.id}/${action}`,
      a.cookie,
      { version: session.version },
    );
    expect(result.status).toBe(200);
    session = result.body;
  };
  now = new Date('2026-10-02T00:05:00Z');
  await command('pause');
  const service = new AnalyticsService(source, prefs, () => now);
  expect(
    (
      await service.read(a.id, {
        date: '2026-10-01',
        granularity: 'day',
        timeZone: 'UTC',
      })
    ).metrics.activeMs!.current,
  ).toBe(0);
  now = new Date('2026-10-02T00:25:00Z');
  await command('resume');
  now = new Date('2026-10-02T00:35:00Z');
  await command('cancel');
  await command('cancel');
  const query = { granularity: 'day' as const, timeZone: 'UTC' };
  expect(
    (await service.read(a.id, { ...query, date: '2026-10-01' })).metrics
      .activeMs!.current,
  ).toBe(600000);
  expect(
    (await service.read(a.id, { ...query, date: '2026-10-02' })).metrics
      .activeMs!.current,
  ).toBe(900000);
  expect(await count(a.id, 'POMODORO_SESSION_COMPLETED')).toBe(0);
  const rows = await source.query<Array<{ total: string }>>(
    'SELECT SUM(TIMESTAMPDIFF(MICROSECOND,started_at,ended_at)/1000) total FROM pomodoro_active_intervals WHERE session_id=?',
    [session.id],
  );
  expect(Number(rows[0]!.total)).toBe(session.activeSeconds * 1000);
  session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  now = new Date(now.getTime() + 1500000);
  await command('complete');
  await command('complete');
  expect(await count(a.id, 'POMODORO_SESSION_COMPLETED')).toBe(1);
});
it('counts ten canceled minutes with zero blocks and unions activities without duplicates', async () => {
  const a = await account();
  now = new Date('2026-10-05T12:00:00Z');
  const session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  now = new Date('2026-10-05T12:10:00Z');
  const canceled = await write(
    'post',
    `/pomodoro/sessions/${session.id}/cancel`,
    a.cookie,
    { version: session.version },
  );
  expect(canceled.body).toMatchObject({
    activeSeconds: 600,
    completedBlocks: 0,
  });
  await source.transaction(async (manager) => {
    const sourceId = randomUUID(),
      transitionId = randomUUID();
    for (let index = 0; index < 2; index++)
      await publishActivity(
        manager,
        a.id,
        'TASK_COMPLETED',
        'task',
        sourceId,
        transitionId,
        now,
      );
    await publishActivity(
      manager,
      a.id,
      'FLASHCARD_REVIEWED',
      'flashcard',
      randomUUID(),
      randomUUID(),
      now,
    );
    await publishActivity(
      manager,
      a.id,
      'TASK_COMPLETED',
      'task',
      randomUUID(),
      randomUUID(),
      new Date('2026-10-04T12:00:00Z'),
    );
  });
  const result = await new AnalyticsService(source, prefs, () => now).read(
    a.id,
    { date: '2026-10-05', granularity: 'day', timeZone: 'UTC' },
  );
  expect(result.metrics.activeMs!.current).toBe(600000);
  expect(result.metrics.pomodoroSessions!.current).toBe(0);
  expect(result.metrics.tasks).toMatchObject({
    current: 1,
    previous: 1,
    difference: 0,
    percent: 0,
  });
  expect(result.frequency.activeDays).toBe(1);
});
it('authenticates HTTP, isolates accounts, validates input, and omits disabled sources from frequency', async () => {
  const a = await account(),
    b = await account();
  const date = new Date().toISOString().slice(0, 10);
  await write('post', '/tasks', a.cookie, {
    title: 'Concluída',
    status: 'COMPLETED',
  });
  const url = `/analytics/study?granularity=day&date=${date}&timeZone=UTC`;
  expect((await request(app).get(url)).status).toBe(401);
  for (const suffix of [
    '&userId=someone',
    '&timeZone=Nope',
    '&date=2023-02-29',
    '&granularity=month',
  ])
    expect((await read(url + suffix, a.cookie)).status).toBe(400);
  const response = await read(url, a.cookie);
  expect(response.status).toBe(200);
  expect(response.headers['cache-control']).toBe('private, no-store');
  const result = studyAnalyticsSchema.parse(response.body);
  expect(result.metrics.tasks).toMatchObject({
    current: 1,
    previous: 0,
    difference: 1,
    percent: null,
  });
  expect(result.period.partial).toBe(true);
  expect(result.frequency.activeDays).toBe(1);
  expect(
    studyAnalyticsSchema.parse((await read(url, b.cookie)).body).metrics.tasks!
      .current,
  ).toBe(0);
  await prefs.update(a.id, {
    tasks: false,
    subjects: true,
    flashcards: false,
    ai: false,
  });
  const omitted = studyAnalyticsSchema.parse((await read(url, a.cookie)).body);
  expect(omitted.metrics.tasks).toBeUndefined();
  expect(omitted.metrics.reviews).toBeUndefined();
  expect(omitted.frequency.activeDays).toBe(0);
  await prefs.update(a.id, { tasks: true, subjects: true, flashcards: true });
  expect(
    studyAnalyticsSchema.parse((await read(url, a.cookie)).body).metrics.tasks!
      .current,
  ).toBe(1);
  const service = new AnalyticsService(
    source,
    prefs,
    () => new Date('2026-06-10T12:00:00Z'),
  );
  const partial = await service.read(a.id, {
    date: '2026-06-10',
    granularity: 'quarter',
    timeZone: 'UTC',
  });
  expect(partial.period).toMatchObject({ partial: true, days: 71 });
  expect(partial.previousPeriod.days).toBe(90);
});
