import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { studyProgressSchema } from '@study-platform/contracts';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { recordStudyActivity } from '../src/modules/study-progress/activity-recorder.js';
import type { ActivityKind } from '../src/modules/analytics/activity-publisher.js';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_progress_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let now = new Date('2026-10-01T12:00:00Z');
const app = createApp({
  source,
  env,
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  progressClock: () => now,
  pomodoroClock: async () => now,
  reviewClock: () => now,
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
async function account(early = true) {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.com`,
    id,
    `${id}@example.com`,
  );
  if (early) {
    await source.query(
      "UPDATE study_progress_tracking SET tracking_started_at_utc='2026-01-01' WHERE user_id=?",
      [user.id],
    );
    await source.query(
      "UPDATE study_timezone_history SET effective_at_utc='2026-01-01' WHERE user_id=?",
      [user.id],
    );
  }
  return {
    ...user,
    cookie: `edutrack_session=${await new SessionRepository(source).create(user.id)}`,
  };
}
const read = (path: string, cookie: string) =>
  request(app).get(path).set('Cookie', cookie);
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
const progress = async (cookie: string) => {
  const response = await read('/study-progress', cookie);
  expect(response.status).toBe(200);
  return studyProgressSchema.parse(response.body);
};
const events = (id: string) =>
  source.query<
    Array<{
      kind: string;
      local_date: string | null;
      timezone_id: string | null;
      occurred_at: Date;
      source_transition_id: string;
    }>
  >(
    'SELECT * FROM study_activity_events WHERE user_id=? ORDER BY occurred_at,id',
    [id],
  );
async function record(
  id: string,
  kind: ActivityKind,
  time: string,
  key = randomUUID(),
) {
  await source.transaction((manager) =>
    recordStudyActivity(
      manager,
      id,
      kind,
      { type: 'test', id: key, transitionId: '1' },
      new Date(time),
    ),
  );
}
it('initializes new accounts at creation and applies/rolls back without backfilling analytics or deleting sources', async () => {
  const a = await account(false);
  const rows = await source.query<
    Array<{ created_at: Date; tracking_started_at_utc: Date }>
  >(
    'SELECT u.created_at,t.tracking_started_at_utc FROM users u JOIN study_progress_tracking t ON t.user_id=u.id WHERE u.id=?',
    [a.id],
  );
  expect(rows[0]!.tracking_started_at_utc).toEqual(rows[0]!.created_at);
  const task = await write('post', '/tasks', a.cookie, {
    title: 'Conteúdo já concluído',
    status: 'COMPLETED',
  });
  expect(task.status).toBe(201);
  expect((await progress(a.cookie)).activeDays).toBe(0);
  expect(source.options.synchronize).toBe(false);
  await source.undoLastMigration();
  expect(
    await source.query("SHOW TABLES LIKE 'study_progress_tracking'"),
  ).toEqual([]);
  expect(
    (
      await source.query('SELECT id FROM study_tasks WHERE id=?', [
        task.body.id,
      ])
    ).length,
  ).toBe(1);
  expect(
    (
      await source.query(
        'SELECT id FROM study_activity_events WHERE user_id=?',
        [a.id],
      )
    ).length,
  ).toBe(1);
  expect(await source.runMigrations()).toHaveLength(1);
  expect(await source.runMigrations()).toHaveLength(0);
  expect((await events(a.id))[0]!.local_date).toBeNull();
  expect(
    (await progress(a.cookie)).achievements.every(
      (item) => item.earnedAt === null,
    ),
  ).toBe(true);
  await record(a.id, 'TASK_COMPLETED', '2020-01-01T12:00:00Z');
  expect((await progress(a.cookie)).activeDays).toBe(0);
});
it('authenticates, isolates two accounts, validates strict IANA input and reads without writes', async () => {
  now = new Date('2026-10-01T12:00:00Z');
  const a = await account(),
    b = await account();
  expect((await request(app).get('/study-progress')).status).toBe(401);
  expect(
    (
      await write('patch', '/account/study-timezone', a.cookie, {
        timeZone: 'wrong',
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await write('patch', '/account/study-timezone', a.cookie, {
        timeZone: 'UTC',
        userId: b.id,
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request(app)
        .patch('/account/study-timezone')
        .set('Cookie', a.cookie)
        .send({ timeZone: 'UTC' })
    ).status,
  ).toBe(403);
  expect((await read(`/study-progress?userId=${b.id}`, a.cookie)).status).toBe(
    400,
  );
  expect(
    (
      await write('patch', '/account/study-timezone', a.cookie, {
        timeZone: 'America/Sao_Paulo',
      })
    ).status,
  ).toBe(200);
  expect((await progress(b.cookie)).timeZone).toBe('UTC');
  expect((await progress(a.cookie)).timeZone).toBe('America/Sao_Paulo');
  await record(a.id, 'TASK_COMPLETED', '2026-10-01T12:01:00Z');
  now = new Date('2026-10-01T13:00:00Z');
  const before = await events(a.id);
  const grants = await source.query(
    'SELECT * FROM study_achievement_grants WHERE user_id=?',
    [a.id],
  );
  const response = await read('/study-progress', a.cookie);
  expect(response.headers['cache-control']).toBe('private, no-store');
  expect(response.body.activeDays).toBe(1);
  expect((await progress(b.cookie)).activeDays).toBe(0);
  expect(await events(a.id)).toEqual(before);
  expect(
    await source.query(
      'SELECT * FROM study_achievement_grants WHERE user_id=?',
      [a.id],
    ),
  ).toEqual(grants);
  await new PreferencesService(source).update(a.id, {
    tasks: false,
    subjects: false,
    flashcards: true,
    ai: false,
  });
  expect((await progress(a.cookie)).activeDays).toBe(1);
  expect((await progress(a.cookie)).achievements[0]!.earnedAt).not.toBeNull();
});
it('freezes historical timezone at midnight and handles spring/fall DST by calendar date', async () => {
  const a = await account();
  now = new Date('2026-03-01T00:00:00Z');
  await write('patch', '/account/study-timezone', a.cookie, {
    timeZone: 'America/New_York',
  });
  await record(a.id, 'TASK_COMPLETED', '2026-03-08T04:59:00Z'); // March 7 23:59
  await record(a.id, 'FLASHCARD_REVIEWED', '2026-03-08T07:01:00Z'); // March 8 03:01
  now = new Date('2026-03-09T04:00:00Z');
  expect(await progress(a.cookie)).toMatchObject({
    today: '2026-03-09',
    activeDays: 2,
    currentStreak: 2,
    longestStreak: 2,
  });
  await write('patch', '/account/study-timezone', a.cookie, {
    timeZone: 'Asia/Tokyo',
  });
  const key = randomUUID();
  await record(a.id, 'POMODORO_BLOCK_COMPLETED', '2026-03-08T04:58:00Z', key);
  await record(a.id, 'POMODORO_BLOCK_COMPLETED', '2026-03-08T04:58:00Z', key);
  const facts = await events(a.id);
  expect(facts).toHaveLength(3);
  expect(facts[0]).toMatchObject({
    local_date: '2026-03-07',
    timezone_id: 'America/New_York',
  });
  expect(facts[2]!.local_date).toBe('2026-03-08');
  const b = await account();
  now = new Date('2026-10-01T00:00:00Z');
  await write('patch', '/account/study-timezone', b.cookie, {
    timeZone: 'America/New_York',
  });
  for (const time of [
    '2026-11-01T03:59:00Z',
    '2026-11-01T05:30:00Z',
    '2026-11-01T06:30:00Z',
  ])
    await record(b.id, 'TASK_COMPLETED', time);
  now = new Date('2026-11-02T05:00:00Z');
  expect(await progress(b.cookie)).toMatchObject({
    activeDays: 2,
    currentStreak: 2,
    longestStreak: 2,
  });
  now = new Date('2026-11-03T05:00:00Z');
  expect((await progress(b.cookie)).currentStreak).toBe(0);
});
it('rolls back producer state, revisions, activity and grants atomically', async () => {
  const a = await account();
  const task = await write('post', '/tasks', a.cookie, { title: 'Transação' });
  await expect(
    source.transaction(async (manager) => {
      await manager.query(
        "UPDATE study_tasks SET status='COMPLETED' WHERE id=?",
        [task.body.id],
      );
      await recordStudyActivity(
        manager,
        a.id,
        'TASK_COMPLETED',
        { type: 'task', id: task.body.id },
        new Date('2026-10-01T12:00:00Z'),
      );
      throw new Error('rollback');
    }),
  ).rejects.toThrow('rollback');
  expect(await events(a.id)).toEqual([]);
  expect(
    await source.query(
      'SELECT * FROM study_achievement_grants WHERE user_id=?',
      [a.id],
    ),
  ).toEqual([]);
  expect(
    await source.query(
      'SELECT * FROM study_activity_source_revisions WHERE user_id=?',
      [a.id],
    ),
  ).toEqual([]);
  expect((await read(`/tasks/${task.body.id}`, a.cookie)).body.status).toBe(
    'PENDING',
  );
});
it('credits only actual parent task transitions including bulk subtasks and reconclusion', async () => {
  const a = await account();
  now = new Date('2027-01-01T12:00:00Z');
  await write('post', '/tasks', a.cookie, {
    title: 'Criada concluída',
    status: 'COMPLETED',
  });
  expect((await progress(a.cookie)).activeDays).toBe(0);
  const task = (await write('post', '/tasks', a.cookie, { title: 'Estudar' }))
    .body;
  const path = `/tasks/${task.id}`;
  expect((await events(a.id)).filter((item) => item.local_date)).toHaveLength(
    0,
  );
  for (const status of ['COMPLETED', 'COMPLETED', 'PENDING', 'COMPLETED'])
    expect((await write('patch', path, a.cookie, { status })).status).toBe(200);
  const credited = (await events(a.id)).filter((item) => item.local_date);
  expect(credited).toHaveLength(2);
  expect(credited.map((item) => item.source_transition_id)).toEqual(['1', '2']);
  const second = (
    await write('post', '/tasks', a.cookie, { title: 'Derivada' })
  ).body;
  const sub = (
    await write('post', `/tasks/${second.id}/subtasks`, a.cookie, {
      title: 'Única',
    })
  ).body;
  const subId = sub.items[0].id;
  expect(subId).toBeTruthy();
  expect(
    (
      await write('patch', `/tasks/${second.id}/subtasks/${subId}`, a.cookie, {
        isCompleted: true,
      })
    ).status,
  ).toBe(200);
  expect((await events(a.id)).filter((item) => item.local_date)).toHaveLength(
    3,
  );
  await write('post', `/tasks/${second.id}/subtasks`, a.cookie, {
    title: 'Outra',
  });
  for (let i = 0; i < 2; i++)
    expect(
      (
        await write('post', `/tasks/${second.id}/complete-subtasks`, a.cookie, {
          confirm: true,
        })
      ).status,
    ).toBe(200);
  expect((await events(a.id)).filter((item) => item.local_date)).toHaveLength(
    4,
  );
  await write('delete', path, a.cookie);
  expect((await events(a.id)).filter((item) => item.local_date)).toHaveLength(
    4,
  );
});
it('records all four review ratings once per persisted event and preserves deleted cards', async () => {
  now = new Date('2026-10-01T12:00:00Z');
  const a = await account();
  const deck = (
    await write('post', '/flashcard-decks', a.cookie, { name: 'Revisão' })
  ).body;
  for (const rating of ['AGAIN', 'HARD', 'GOOD', 'EASY']) {
    const card = (
      await write('post', `/flashcard-decks/${deck.id}/cards`, a.cookie, {
        front: 'Pergunta',
        back: 'Resposta',
      })
    ).body;
    const path = `/flashcard-decks/${deck.id}/cards/${card.id}`;
    await read(path, a.cookie);
    const body = { rating, expectedRevision: 1, idempotencyKey: randomUUID() };
    expect(
      (await write('post', `${path}/reviews`, a.cookie, body)).status,
    ).toBe(200);
    expect(
      (await write('post', `${path}/reviews`, a.cookie, body)).status,
    ).toBe(200);
    await write('delete', path, a.cookie);
  }
  expect(await events(a.id)).toHaveLength(4);
  expect((await progress(a.cookie)).activeDays).toBe(1);
});
it('materializes full Pomodoro blocks at exact boundaries with historical timezone, pauses and concurrent cancellation', async () => {
  const a = await account();
  now = new Date('2026-10-01T23:30:00Z');
  let session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  now = new Date('2026-10-02T00:00:00Z');
  await write('patch', '/account/study-timezone', a.cookie, {
    timeZone: 'Asia/Tokyo',
  });
  now = new Date('2026-10-02T00:05:00Z');
  expect((await progress(a.cookie)).activeDays).toBe(0); // Read does not materialize producer facts.
  const responses = await Promise.all([
    write('post', `/pomodoro/sessions/${session.id}/cancel`, a.cookie, {
      version: session.version,
    }),
    write('post', `/pomodoro/sessions/${session.id}/cancel`, a.cookie, {
      version: session.version,
    }),
  ]);
  expect(responses.map((value) => value.status)).toEqual([200, 200]);
  expect((await events(a.id))[0]).toMatchObject({
    kind: 'POMODORO_BLOCK_COMPLETED',
    source_transition_id: '1',
    timezone_id: 'UTC',
    local_date: '2026-10-01',
    occurred_at: new Date('2026-10-01T23:55:00Z'),
  });
  session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  now = new Date('2026-10-02T00:15:00Z');
  session = (
    await write('post', `/pomodoro/sessions/${session.id}/pause`, a.cookie, {
      version: session.version,
    })
  ).body;
  now = new Date('2026-10-02T01:00:00Z');
  session = (
    await write('post', `/pomodoro/sessions/${session.id}/resume`, a.cookie, {
      version: session.version,
    })
  ).body;
  now = new Date('2026-10-02T01:20:00Z');
  session = (
    await write(
      'post',
      `/pomodoro/sessions/${session.id}/next-block`,
      a.cookie,
      { version: session.version },
    )
  ).body;
  expect((await events(a.id))[1]!.occurred_at).toEqual(
    new Date('2026-10-02T01:15:00Z'),
  );
  now = new Date('2026-10-02T01:45:00Z');
  await write('post', `/pomodoro/sessions/${session.id}/complete`, a.cookie, {
    version: session.version,
  });
  expect(
    (await events(a.id)).filter(
      (item) => item.kind === 'POMODORO_BLOCK_COMPLETED',
    ),
  ).toHaveLength(3);
  session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  now = new Date('2026-10-02T01:55:00Z');
  await write('post', `/pomodoro/sessions/${session.id}/cancel`, a.cookie, {
    version: session.version,
  });
  expect((await events(a.id)).filter((item) => item.local_date)).toHaveLength(
    3,
  );
});
it('grants all seven achievements once under concurrency, corrects first earned dates for late events and never revokes', async () => {
  const a = await account();
  now = new Date('2026-11-01T00:00:00Z');
  const jobs: Array<Promise<void>> = [];
  for (let i = 0; i < 10; i++)
    jobs.push(
      record(
        a.id,
        'TASK_COMPLETED',
        `2026-10-${String(i + 2).padStart(2, '0')}T12:00:00Z`,
      ),
    );
  for (const [kind, count] of [
    ['POMODORO_BLOCK_COMPLETED', 5],
    ['FLASHCARD_REVIEWED', 20],
    ['SUBJECT_PLAN_ITEM_COMPLETED', 2],
    ['ROADMAP_BLOCK_COMPLETED', 3],
  ] as const)
    for (let i = 0; i < count; i++)
      jobs.push(record(a.id, kind, '2026-10-11T15:00:00Z'));
  await Promise.all(jobs);
  let result = await progress(a.cookie);
  expect(result.achievements.every((item) => item.earnedAt !== null)).toBe(
    true,
  );
  expect(
    result.achievements.find((item) => item.code === 'TEN_TASKS')!.earnedAt,
  ).toBe('2026-10-11T12:00:00.000Z');
  await record(a.id, 'TASK_COMPLETED', '2026-10-01T12:00:00Z');
  result = await progress(a.cookie);
  expect(
    result.achievements.find((item) => item.code === 'TEN_TASKS')!.earnedAt,
  ).toBe('2026-10-10T12:00:00.000Z');
  expect(
    result.achievements.find((item) => item.code === 'SEVEN_DAY_STREAK')!
      .earnedAt,
  ).toBe('2026-10-07T12:00:00.000Z');
  expect(
    (
      await source.query(
        'SELECT * FROM study_achievement_grants WHERE user_id=?',
        [a.id],
      )
    ).length,
  ).toBe(7);
  expect(result.currentStreak).toBe(0);
  expect(result.longestStreak).toBe(11);
});
it('credits only entire roadmap blocks and actual manual item transitions without AI, retaining deletion history', async () => {
  const a = await account();
  now = new Date('2027-01-01T12:00:00Z');
  await new PreferencesService(source).update(a.id, { ai: false });
  const subject = await write('post', '/subjects', a.cookie, {
    name: 'Matemática',
    currentLevel: 'BEGINNER',
    objective: 'Estudar',
    dueDate: '2027-12-01',
    weeklyHours: 2,
    knownTopics: [],
  });
  expect(subject.status).toBe(201);
  const path = `/subjects/${subject.body.id}`;
  await write('post', `${path}/plan-items`, a.cookie, {
    title: 'Criado completo',
    status: 'COMPLETED',
  });
  const item = (
    await write('post', `${path}/plan-items`, a.cookie, { title: 'Ler' })
  ).body.planItems.find((value: { title: string }) => value.title === 'Ler');
  for (const status of ['COMPLETED', 'COMPLETED', 'PENDING', 'COMPLETED'])
    expect(
      (
        await write('patch', `${path}/plan-items/${item.id}`, a.cookie, {
          status,
        })
      ).status,
    ).toBe(200);
  let roadmap = (
    await write('post', `${path}/roadmaps`, a.cookie, {
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
    })
  ).body;
  const step = async (index: number, completed: boolean) => {
    const response = await write(
      'patch',
      `${path}/roadmaps/${roadmap.id}/steps/${roadmap.blocks[0].steps[index].id}`,
      a.cookie,
      { baseRevision: roadmap.revision, completed },
    );
    expect(response.status).toBe(200);
    roadmap = response.body;
  };
  await step(0, true);
  expect(
    (await events(a.id)).filter(
      (item) => item.kind === 'ROADMAP_BLOCK_COMPLETED',
    ),
  ).toHaveLength(0);
  await step(1, true);
  await step(1, true);
  await step(1, false);
  await step(1, true);
  expect((await events(a.id)).filter((item) => item.local_date)).toHaveLength(
    4,
  );
  await write('delete', path, a.cookie);
  expect((await events(a.id)).filter((item) => item.local_date)).toHaveLength(
    4,
  );
});
