import { randomBytes, randomUUID } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { dashboardSchema } from '@study-platform/contracts';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { AnalyticsService } from '../src/modules/analytics/analytics.service.js';
import { TasksService } from '../src/modules/tasks/tasks.service.js';
import { SubjectsService } from '../src/modules/subjects/subjects.service.js';
import { ReviewsService } from '../src/modules/flashcards/reviews.service.js';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_dashboard_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let now = new Date('2026-10-05T12:00:00Z');
const app = createApp({
  source,
  env,
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  dashboardClock: () => now,
  progressClock: () => now,
  pomodoroClock: async () => now,
  reviewClock: () => now,
});
beforeAll(async () => {
  await admin.initialize();
  await admin.query(`CREATE DATABASE \`${database}\``);
  await source.initialize();
  await source.runMigrations();
  await source.query(
    "UPDATE study_analytics_coverage SET started_at='2026-01-01'",
  );
});
afterEach(() => {
  vi.restoreAllMocks();
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
  return {
    ...user,
    cookie: `edutrack_session=${await new SessionRepository(source).create(user.id)}`,
  };
}
const read = (path: string, cookie: string) =>
  request(app).get(path).set('Cookie', cookie);
const write = (
  method: 'post' | 'patch',
  path: string,
  cookie: string,
  body: object = {},
) =>
  request(app)
    [method](path)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .send(body);
async function dashboard(cookie: string) {
  const response = await read('/dashboard', cookie);
  expect(response.status).toBe(200);
  expect(response.headers['cache-control']).toBe('private, no-store');
  return dashboardSchema.parse(response.body);
}
async function subject(cookie: string, name: string, dueDate: string) {
  const response = await write('post', '/subjects', cookie, {
    name,
    dueDate,
    currentLevel: 'BEGINNER',
    objective: 'Estudar',
    weeklyHours: 2,
    knownTopics: [],
  });
  expect(response.status).toBe(201);
  return response.body as { id: string };
}
it('requires a session, rejects client owners and returns genuine empty sections for a new account', async () => {
  expect((await request(app).get('/dashboard')).status).toBe(401);
  const a = await account();
  expect(
    (await read(`/dashboard?userId=${randomUUID()}`, a.cookie)).status,
  ).toBe(400);
  const result = await dashboard(a.cookie);
  expect(result.asOf).toBe(now.toISOString());
  for (const key of [
    'tasks',
    'subjects',
    'flashcards',
    'pomodoro',
    'streak',
    'week',
  ] as const)
    expect(result[key]!.state).toBe('empty');
});
it('limits deadlines to five, orders ties by ID, excludes completed/undated tasks and uses official subtask progress', async () => {
  const a = await account(),
    b = await account();
  now = new Date('2027-01-05T12:00:00Z');
  await write('post', '/tasks', b.cookie, {
    title: 'Outra conta',
    dueDate: '2026-01-01',
  });
  const ids: string[] = [];
  for (let i = 0; i < 7; i++) {
    const task = await write('post', '/tasks', a.cookie, {
      title: `Prazo ${i}`,
      dueDate: '2026-12-01',
    });
    ids.push(task.body.id);
  }
  const taskId = ids.sort()[0]!;
  const sub = (
    await write('post', `/tasks/${taskId}/subtasks`, a.cookie, { title: 'Um' })
  ).body.items[0];
  await write('post', `/tasks/${taskId}/subtasks`, a.cookie, { title: 'Dois' });
  await write('patch', `/tasks/${taskId}/subtasks/${sub.id}`, a.cookie, {
    isCompleted: true,
  });
  await write('post', '/tasks', a.cookie, { title: 'Sem prazo' });
  await write('post', '/tasks', a.cookie, {
    title: 'Concluída',
    status: 'COMPLETED',
    dueDate: '2020-01-01',
  });
  const result = (await dashboard(a.cookie)).tasks!;
  expect(result.state).toBe('ready');
  if (result.state === 'error') throw new Error('tasks unavailable');
  expect(result.data.counts).toEqual({
    PENDING: 7,
    IN_PROGRESS: 1,
    COMPLETED: 1,
  });
  expect(result.data.withoutDeadline).toBe(1);
  expect(result.data.upcoming.map((item) => item.id)).toEqual(ids.slice(0, 5));
  expect(result.data.upcoming[0]).toEqual(
    (await read(`/tasks/${taskId}`, a.cookie)).body,
  );
  expect(result.data.upcoming[0]!.progressPercent).toBe(50);
  const ownB = (await dashboard(b.cookie)).tasks!;
  if (ownB.state === 'error') throw new Error('tasks unavailable');
  expect(ownB.data.upcoming[0]!.title).toBe('Outra conta');
  const c = await account();
  await write('post', '/tasks', c.cookie, { title: 'Só sem prazo' });
  const noDeadline = (await dashboard(c.cookie)).tasks!;
  if (noDeadline.state === 'error') throw new Error('tasks unavailable');
  expect(noDeadline.data.upcoming).toEqual([]);
  expect(noDeadline.data.withoutDeadline).toBe(1);
});
it('selects pending subjects by deadline/update/ID and falls back to most recently updated without pending work', async () => {
  const a = await account(),
    b = await account();
  const first = await subject(a.cookie, 'Base', '2026-12-01'),
    second = await subject(a.cookie, 'Empate', '2026-12-01'),
    later = await subject(a.cookie, 'Futura', '2027-12-01');
  await subject(b.cookie, 'Alheia', '2020-01-01');
  for (const row of [first, second, later])
    await write('post', `/subjects/${row.id}/plan-items`, a.cookie, {
      title: 'Ler',
    });
  await source.query(
    "UPDATE study_subjects SET updated_at='2026-10-01' WHERE user_id=?",
    [a.id],
  );
  const lower = [first.id, second.id].sort()[0];
  let section = (await dashboard(a.cookie)).subjects!;
  if (section.state === 'error') throw new Error('subjects unavailable');
  expect(section.data!.id).toBe(lower);
  expect(section.data!.source).toBe('manual');
  expect(section.data!.progressPercent).toBe(0);
  await source.query(
    "UPDATE study_subjects SET updated_at='2026-10-02' WHERE id=?",
    [second.id],
  );
  section = (await dashboard(a.cookie)).subjects!;
  if (section.state === 'error') throw new Error('subjects unavailable');
  expect(section.data!.id).toBe(second.id);
  const roadmap = await write(
    'post',
    `/subjects/${second.id}/roadmaps`,
    a.cookie,
    {
      title: 'Roadmap ativo',
      description: 'Estudo',
      blocks: [
        {
          title: 'Bloco',
          description: 'Estudo',
          steps: [
            { title: 'Um', description: 'Estudo' },
            { title: 'Dois', description: 'Estudo' },
          ],
        },
      ],
    },
  );
  expect(roadmap.status).toBe(201);
  await write(
    'patch',
    `/subjects/${second.id}/roadmaps/${roadmap.body.id}/steps/${roadmap.body.blocks[0].steps[0].id}`,
    a.cookie,
    { baseRevision: roadmap.body.revision, completed: true },
  );
  section = (await dashboard(a.cookie)).subjects!;
  if (section.state === 'error') throw new Error('subjects unavailable');
  expect(section.data).toMatchObject({
    id: second.id,
    roadmapId: roadmap.body.id,
    total: 2,
    completed: 1,
    progressPercent: 50,
  });
  await source.query(
    "UPDATE subject_plan_items i JOIN study_subjects s ON s.id=i.subject_id SET i.status='COMPLETED' WHERE s.user_id=?",
    [a.id],
  );
  await source.query(
    'UPDATE subject_roadmap_steps p JOIN subject_roadmap_blocks b ON b.id=p.block_id JOIN subject_roadmaps r ON r.id=b.roadmap_id JOIN study_subjects s ON s.id=r.subject_id SET p.completed=true WHERE s.user_id=?',
    [a.id],
  );
  await source.query(
    "UPDATE study_subjects SET updated_at='2026-10-05' WHERE id=?",
    [later.id],
  );
  section = (await dashboard(a.cookie)).subjects!;
  if (section.state === 'error') throw new Error('subjects unavailable');
  expect(section.data).toMatchObject({ id: later.id, hasPending: false });
});
it('omits and never calls disabled producers, restores preserved summaries and works without AI/all optional modules', async () => {
  const a = await account();
  await write('post', '/tasks', a.cookie, { title: 'Preservada' });
  await new PreferencesService(source).update(a.id, {
    tasks: false,
    subjects: false,
    flashcards: true,
    ai: false,
  });
  const tasks = vi.spyOn(TasksService.prototype, 'dashboardSummary'),
    subjects = vi.spyOn(SubjectsService.prototype, 'dashboardSummary');
  const result = await dashboard(a.cookie);
  expect(result.tasks).toBeUndefined();
  expect(result.subjects).toBeUndefined();
  expect(tasks).not.toHaveBeenCalled();
  expect(subjects).not.toHaveBeenCalled();
  await new PreferencesService(source).update(a.id, { tasks: true });
  expect((await dashboard(a.cookie)).tasks?.state).toBe('ready');
  await source.query(
    'UPDATE user_preferences SET tasks_enabled=false,subjects_enabled=false,flashcards_enabled=false WHERE user_id=?',
    [a.id],
  );
  tasks.mockClear();
  subjects.mockClear();
  const reviews = vi.spyOn(ReviewsService.prototype, 'pending');
  const minimal = await dashboard(a.cookie);
  expect(minimal.tasks).toBeUndefined();
  expect(minimal.flashcards).toBeUndefined();
  expect(minimal.subjects).toBeUndefined();
  expect(tasks).not.toHaveBeenCalled();
  expect(subjects).not.toHaveBeenCalled();
  expect(reviews).not.toHaveBeenCalled();
  expect(minimal.pomodoro.state).toBe('empty');
});
it('uses official reviews, streak and local ISO week values and completed Pomodoro count excluding canceled sessions', async () => {
  const a = await account();
  now = new Date('2026-10-05T01:00:00Z');
  await write('patch', '/account/study-timezone', a.cookie, {
    timeZone: 'America/Sao_Paulo',
  });
  const deck = (
    await write('post', '/flashcard-decks', a.cookie, { name: 'Baralho' })
  ).body;
  await write('post', `/flashcard-decks/${deck.id}/cards`, a.cookie, {
    front: 'P',
    back: 'R',
  });
  let session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  now = new Date('2026-10-05T01:25:00Z');
  await write('post', `/pomodoro/sessions/${session.id}/complete`, a.cookie, {
    version: session.version,
  });
  session = (await write('post', '/pomodoro/sessions', a.cookie)).body;
  now = new Date('2026-10-05T01:35:00Z');
  await write('post', `/pomodoro/sessions/${session.id}/cancel`, a.cookie, {
    version: session.version,
  });
  const result = await dashboard(a.cookie);
  const official = (await read('/study-progress', a.cookie)).body;
  expect(result.streak).toEqual({ state: 'ready', data: official });
  expect(result.timeZone).toBe('America/Sao_Paulo');
  expect(result.pomodoro).toEqual({
    state: 'ready',
    data: { session: null, completedSessions: 1 },
  });
  expect(result.flashcards).toEqual({
    state: 'ready',
    data: {
      pending: (await read('/flashcard-decks/reviews/pending', a.cookie)).body
        .total,
    },
  });
  const week = await new AnalyticsService(
    source,
    new PreferencesService(source),
    () => now,
  ).read(a.id, {
    granularity: 'week',
    date: '2026-10-04',
    timeZone: 'America/Sao_Paulo',
  });
  expect(result.week).toEqual({ state: 'ready', data: week });
  expect(week.period.start).toBe('2026-09-28');
});
it('isolates producer failure without exposing details or changing it into zero, and stops on preference failure', async () => {
  const a = await account();
  const spy = vi
    .spyOn(AnalyticsService.prototype, 'read')
    .mockRejectedValue(new Error('Secret SQL stack'));
  const result = await dashboard(a.cookie);
  expect(result.week.state).toBe('error');
  expect(result.tasks!.state).toBe('empty');
  expect(JSON.stringify(result)).not.toContain('Secret');
  spy.mockRestore();
  const tasks = vi.spyOn(TasksService.prototype, 'dashboardSummary');
  vi.spyOn(PreferencesService.prototype, 'read').mockRejectedValue(
    new Error('prefs unavailable'),
  );
  expect((await read('/dashboard', a.cookie)).status).toBe(500);
  expect(tasks).not.toHaveBeenCalled();
});
it('reuses the public start conflict and returns one open session after concurrent tabs', async () => {
  const a = await account();
  const responses = await Promise.all([
    write('post', '/pomodoro/sessions', a.cookie),
    write('post', '/pomodoro/sessions', a.cookie),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([
    201, 409,
  ]);
  const section = (await dashboard(a.cookie)).pomodoro;
  if (section.state === 'error') throw new Error('pomodoro unavailable');
  expect(section.data.session).toEqual(
    (await read('/pomodoro/sessions/current', a.cookie)).body.session,
  );
  expect(
    (
      await source.query(
        'SELECT * FROM pomodoro_open_sessions WHERE user_id=?',
        [a.id],
      )
    ).length,
  ).toBe(1);
});
