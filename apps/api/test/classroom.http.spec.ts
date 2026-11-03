import { randomBytes, randomUUID } from 'node:crypto';
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import pino from 'pino';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createClassroomRuntime } from '../src/classroom-runtime.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { ClassroomTokenCrypto } from '../src/modules/classroom/token-crypto.js';
import { classroomScopes } from '../src/modules/classroom/scopes.js';
import { CreateClassroomIntegration20261102020000 } from '../src/database/migrations/20261102020000-CreateClassroomIntegration.js';
import { taskFromClassroom } from '../src/modules/classroom/google-client.js';
import { SubjectsService } from '../src/modules/subjects/subjects.service.js';
import { SubjectsRepository } from '../src/modules/subjects/subjects.repository.js';
import { TasksService } from '../src/modules/tasks/tasks.service.js';
import { TasksRepository } from '../src/modules/tasks/tasks.repository.js';
import { classroomOIDCFixture } from './classroom-oidc-fixture.js';
import { ClassroomOAuthService } from '../src/modules/classroom/classroom-oauth.service.js';

const env = {
  ...loadEnv(),
  GOOGLE_CLIENT_ID: 'synthetic-client',
  GOOGLE_CLIENT_SECRET: 'synthetic-secret',
  CLASSROOM_ENCRYPTION_KEY: 'd'.repeat(64),
};
const database = `${env.TEST_DB_NAME}_classroom_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME }),
  source = createDataSource({ ...env, DB_NAME: database });
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
});
const prefs = new PreferencesService(source),
  subjects = new SubjectsService(new SubjectsRepository(source), prefs),
  tasks = new TasksService(new TasksRepository(source), subjects);
const course = {
  id: 'course1',
  name: 'Matemática',
  section: null,
  link: 'https://classroom.google.com/c/1',
  state: 'ACTIVE',
};
const subjectInput = {
  name: 'Matemática',
  currentLevel: 'BEGINNER',
  objective: 'Aprender álgebra',
  dueDate: '2026-12-10',
  weeklyHours: 2,
  knownTopics: [],
};
let remoteTitle = 'Primeira atividade';
const transport = vi.fn<typeof fetch>(async (url) => {
  const path = new URL(String(url)).pathname;
  if (path.endsWith('/courseWork'))
    return Response.json({
      courseWork: [
        {
          id: 'work1',
          title: remoteTitle,
          alternateLink: 'https://classroom.google.com/c/1/a/1',
          dueDate: { year: 2026, month: 11, day: 2 },
          dueTime: { hours: 1 },
        },
      ],
    });
  if (path.endsWith('/courseWorkMaterials'))
    return Response.json({ courseWorkMaterial: [] });
  if (path.endsWith('/courses/course1'))
    return Response.json({
      id: course.id,
      name: course.name,
      courseState: 'ACTIVE',
      alternateLink: course.link,
    });
  if (path.endsWith('/courses/denied'))
    return new Response(null, { status: 403 });
  if (path.endsWith('/courses'))
    return Response.json({
      courses: [{ id: course.id, name: course.name, courseState: 'ACTIVE' }],
    });
  return new Response(null, { status: 404 });
});
const runtime = createClassroomRuntime(source, env, undefined, transport);
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
async function account(connect = true) {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.test`,
    id,
    `${id}@example.test`,
  );
  const cookie = `edutrack_session=${await new SessionRepository(source).create(user.id)}`;
  if (connect) {
    const tokens = new ClassroomTokenCrypto(
      env.CLASSROOM_ENCRYPTION_KEY,
    ).encrypt(user.id, {
      accessToken: 'synthetic-access',
      refreshToken: 'synthetic-refresh',
      expiresAt: Date.now() + 3600000,
    });
    await runtime.service.repository.saveConnection(
      user.id,
      0,
      'google-sub',
      'student@example.test',
      Object.values(classroomScopes),
      tokens,
    );
  }
  return { ...user, cookie };
}
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

it('backfills existing onboarding while new local/Google preferences start at modules', async () => {
  const migration = new CreateClassroomIntegration20261102020000(),
    runner = source.createQueryRunner();
  try {
    await migration.down(runner);
    const old = await account(false);
    await migration.up(runner);
    expect((await prefs.onboarding(old.id)).step).toBe('completed');
    const fresh = await account(false);
    expect((await prefs.onboarding(fresh.id)).step).toBe('modules');
    expect(
      (await request(app).get('/auth/me').set('Cookie', fresh.cookie)).body.user
        .onboardingStep,
    ).toBe('modules');
  } finally {
    await runner.release();
  }
});
it('keeps login Google disconnected and exposes no credential fields', async () => {
  const user = await account(false);
  const result = await request(app)
    .get('/integrations/google-classroom/connection')
    .set('Cookie', user.cookie);
  expect(result.status).toBe(200);
  expect(result.body.state).toBe('disconnected');
  expect(JSON.stringify(result.body)).not.toContain('Token');
  expect(result.headers['cache-control']).toContain('no-store');
});
it('binds OAuth attempts to the browser/session and consumes them once', async () => {
  const user = await account(false);
  const { secretHash } =
    await import('../src/modules/auth/session.repository.js');
  await runtime.service.repository.attempt(
    user.id,
    'session',
    secretHash('state'),
    secretHash('browser'),
    'verifier',
    'nonce',
    'import',
  );
  await expect(
    runtime.service.repository.consume(
      user.id,
      'other',
      secretHash('state'),
      secretHash('browser'),
    ),
  ).rejects.toMatchObject({ code: 'CLASSROOM_OAUTH_FAILED' });
  await runtime.service.repository.consume(
    user.id,
    'session',
    secretHash('state'),
    secretHash('browser'),
  );
  await expect(
    runtime.service.repository.consume(
      user.id,
      'session',
      secretHash('state'),
      secretHash('browser'),
    ),
  ).rejects.toMatchObject({ code: 'CLASSROOM_OAUTH_FAILED' });
});
it('requires valid subject planning and imports once under concurrent requests', async () => {
  const user = await account();
  await runtime.service.select(user.id, {
    courses: [
      {
        courseId: course.id,
        destination: { kind: 'new', subject: subjectInput },
      },
    ],
  });
  const command = { requestId: randomUUID(), courseIds: [course.id] };
  const [a, b] = await Promise.all([
    runtime.service.start(user.id, 'import', command),
    runtime.service.start(user.id, 'import', command),
  ]);
  expect(a.operation.id).toBe(b.operation.id);
  await runtime.service.runOnce();
  const result = await runtime.service.operations.result(
    user.id,
    a.operation.id,
    1,
    20,
  );
  expect(result.operation.state).toBe('completed');
  expect(result.operation.counts.subjects.added).toBe(1);
  expect(result.operation.counts.tasks.added).toBe(1);
  const next = await runtime.service.start(user.id, 'import', {
    ...command,
    requestId: randomUUID(),
  });
  await runtime.service.runOnce();
  expect(
    (await runtime.service.operations.result(user.id, next.operation.id, 1, 20))
      .operation.counts.tasks.unchanged,
  ).toBe(1);
  expect((await tasks.list(user.id, {})).total).toBe(1);
  expect((await subjects.list(user.id, {})).total).toBe(1);
});
it('preserves manual edits, resolves conflicts explicitly and rejects stale revisions', async () => {
  const user = await account();
  const imported = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        receiptId: randomUUID(),
        connectionVersion: 1,
        ...taskFromClassroom(
          { id: 'task2', title: 'Remote original' },
          course,
          'google-sub',
          'UTC',
          null,
        ),
      }),
  );
  await tasks.update(user.id, imported.localId!, {
    title: 'Meu título',
    status: 'COMPLETED',
  });
  const changed = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        receiptId: randomUUID(),
        connectionVersion: 1,
        ...taskFromClassroom(
          { id: 'task2', title: 'Remote edit' },
          course,
          'google-sub',
          'UTC',
          null,
        ),
      }),
  );
  expect(changed.outcome).toBe('conflict');
  expect((await tasks.detail(user.id, imported.localId!)).title).toBe(
    'Meu título',
  );
  await expect(
    tasks.resolveClassroom(
      user.id,
      changed.conflict!.id,
      changed.conflict!.revision - 1,
      'accept_remote',
    ),
  ).rejects.toMatchObject({ status: 409 });
  await tasks.resolveClassroom(
    user.id,
    changed.conflict!.id,
    changed.conflict!.revision,
    'accept_remote',
  );
  expect((await tasks.detail(user.id, imported.localId!)).title).toBe(
    'Remote edit',
  );
  expect((await tasks.detail(user.id, imported.localId!)).status).toBe(
    'COMPLETED',
  );
});
it('keeps tombstones and allows explicit restoration without duplicate tasks', async () => {
  const user = await account(),
    input = {
      receiptId: randomUUID(),
      connectionVersion: 1,
      ...taskFromClassroom(
        { id: 'deleted', title: 'Deleted' },
        course,
        'google-sub',
        'UTC',
        null,
      ),
    };
  const added = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) => tasks.importClassroom(manager, user.id, input),
  );
  await tasks.delete(user.id, added.localId!);
  const ignored = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        ...input,
        receiptId: randomUUID(),
      }),
  );
  expect(ignored.outcome).toBe('ignored');
  const restored = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        ...input,
        receiptId: randomUUID(),
        restoreDeleted: true,
      }),
  );
  expect(restored.outcome).toBe('added');
  expect((await tasks.list(user.id, {})).total).toBe(1);
});
it('imports only tasks with subjects disabled and rejects writes after disabling tasks/disconnecting', async () => {
  const user = await account();
  await prefs.update(user.id, { subjects: false });
  await runtime.service.select(user.id, {
    courses: [{ courseId: course.id, destination: { kind: 'none' } }],
  });
  const job = await runtime.service.start(user.id, 'import', {
    requestId: randomUUID(),
    courseIds: [course.id],
  });
  await runtime.service.runOnce();
  expect(
    (await runtime.service.operations.result(user.id, job.operation.id, 1, 20))
      .operation.state,
  ).toBe('completed');
  expect((await tasks.list(user.id, {})).items[0]!.subjectId).toBeNull();
  await prefs.update(user.id, { tasks: false });
  await expect(
    runtime.service.repository.allowed(user.id, 1, ['tasks'], async () => {}),
  ).rejects.toMatchObject({ status: 403 });
  await runtime.service.repository.disconnect(user.id);
  await expect(
    runtime.service.repository.allowed(user.id, 1, [], async () => {}),
  ).rejects.toMatchObject({ code: 'CLASSROOM_CONNECTION_CHANGED' });
});
it('isolates operations, selections and mutation origins by authenticated user', async () => {
  const a = await account(),
    b = await account();
  await runtime.service.select(a.id, {
    courses: [{ courseId: course.id, destination: { kind: 'none' } }],
  });
  const job = await runtime.service.start(a.id, 'import', {
    requestId: randomUUID(),
    courseIds: [course.id],
  });
  expect(
    (
      await request(app)
        .get(`/integrations/google-classroom/operations/${job.operation.id}`)
        .set('Cookie', b.cookie)
    ).status,
  ).toBe(404);
  expect(
    (
      await write('put', '/integrations/google-classroom/selection', a.cookie, {
        courses: [
          {
            courseId: '1',
            destination: { kind: 'new', subject: { name: 'Missing' } },
          },
        ],
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request(app)
        .put('/integrations/google-classroom/selection')
        .set('Cookie', a.cookie)
        .send({ courses: [] })
    ).status,
  ).toBe(403);
});
it('reports partial imports and continues after inaccessible courses', async () => {
  const user = await account();
  await source.query(
    'INSERT INTO classroom_selections(user_id,google_subject,course_id,selection) VALUES (?,?,?,?)',
    [
      user.id,
      'google-sub',
      'denied',
      JSON.stringify({ courseId: 'denied', destination: { kind: 'none' } }),
    ],
  );
  await source.query(
    'INSERT INTO classroom_selections(user_id,google_subject,course_id,selection) VALUES (?,?,?,?)',
    [
      user.id,
      'google-sub',
      course.id,
      JSON.stringify({ courseId: course.id, destination: { kind: 'none' } }),
    ],
  );
  await prefs.update(user.id, { subjects: false });
  const job = await runtime.service.start(user.id, 'import', {
    requestId: randomUUID(),
    courseIds: ['denied', course.id],
  });
  while (await runtime.service.runOnce()) {
    /* drain user-requested fixtures */
  }
  const result = await runtime.service.operations.result(
    user.id,
    job.operation.id,
    1,
    20,
  );
  expect(result.operation.state).toBe('partial');
  expect(
    result.items.some((item) => item.reason?.includes('Acesso negado')),
  ).toBe(true);
});
it('converts a Google UTC due time to study calendar and preserves original instant', () => {
  const result = taskFromClassroom(
    {
      id: '1',
      title: 'Deadline',
      dueDate: { year: 2026, month: 11, day: 2 },
      dueTime: { hours: 1 },
    },
    course,
    'google-sub',
    'America/Sao_Paulo',
    null,
  );
  expect(result.task.dueDate).toBe('2026-11-01');
  expect(result.source.dueAt).toBe('2026-11-02T01:00:00Z');
  expect(
    taskFromClassroom(
      { id: '2', title: 'No deadline' },
      course,
      'google-sub',
      'UTC',
      null,
    ).task.dueDate,
  ).toBeNull();
});
it('retains a pending conflict on repeated remote reads and acknowledges keep-local decisions', async () => {
  const user = await account();
  const input = {
    connectionVersion: 1,
    ...taskFromClassroom(
      { id: 'pending-conflict', title: 'Remote first' },
      course,
      'google-sub',
      'UTC',
      null,
    ),
  };
  const added = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        ...input,
        receiptId: randomUUID(),
      }),
  );
  await tasks.update(user.id, added.localId!, { title: 'Local decision' });
  const changed = { ...input, task: { ...input.task, title: 'Remote second' } };
  let result = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        ...changed,
        receiptId: randomUUID(),
      }),
  );
  expect(result.outcome).toBe('conflict');
  result = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        ...changed,
        receiptId: randomUUID(),
      }),
  );
  expect(result.outcome).toBe('conflict');
  await tasks.resolveClassroom(
    user.id,
    result.conflict!.id,
    result.conflict!.revision,
    'keep_local',
  );
  result = await runtime.service.repository.allowed(
    user.id,
    1,
    ['tasks'],
    (manager) =>
      tasks.importClassroom(manager, user.id, {
        ...changed,
        receiptId: randomUUID(),
      }),
  );
  expect(result.outcome).toBe('unchanged');
  expect((await tasks.detail(user.id, added.localId!)).title).toBe(
    'Local decision',
  );
});
it('recovers an expired lease and replays persisted receipts without duplicating imported data', async () => {
  const user = await account();
  await prefs.update(user.id, { subjects: false });
  await runtime.service.select(user.id, {
    courses: [{ courseId: course.id, destination: { kind: 'none' } }],
  });
  const job = await runtime.service.start(user.id, 'import', {
    requestId: randomUUID(),
    courseIds: [course.id],
  });
  await runtime.service.operations.claim(randomUUID());
  await source.query(
    'UPDATE classroom_operations SET lease_until=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE user_id=? AND id=?',
    [user.id, job.operation.id],
  );
  await runtime.service.runOnce();
  expect((await tasks.list(user.id, {})).total).toBe(1);
  const result = await runtime.service.operations.result(
    user.id,
    job.operation.id,
    1,
    20,
  );
  expect(result.operation.state).toBe('completed');
  expect(result.operation.counts.tasks.added).toBe(1);
});

it('keeps Classroom consent separate, validates granted scopes, and handles refresh/revocation', async () => {
  const user = await account(false),
    session = { userId: user.id, id: randomUUID() },
    fixture = classroomOIDCFixture(),
    oauth = new ClassroomOAuthService(
      runtime.service.repository,
      env,
      fixture.transport,
    );
  const started = await oauth.start(session, 'import');
  const authorization = new URL(started.url);
  expect(authorization.searchParams.get('scope')).not.toContain(
    'https://www.googleapis.com/auth/drive.readonly',
  );
  expect(authorization.searchParams.get('code_challenge_method')).toBe('S256');
  fixture.state.nonce = authorization.searchParams.get('nonce')!;
  const callback = new URL(
    `${env.API_PUBLIC_ORIGIN}/integrations/google-classroom/callback`,
  );
  callback.searchParams.set('code', 'synthetic-code');
  callback.searchParams.set('state', authorization.searchParams.get('state')!);
  await oauth.callback(session, callback, started.browserSecret);
  expect((await runtime.service.status(user.id)).state).toBe('connected');
  const row = await runtime.service.repository.connection(user.id);
  expect(row!.encrypted_tokens).not.toContain('synthetic-access');
  const encrypted = new ClassroomTokenCrypto(
    env.CLASSROOM_ENCRYPTION_KEY,
  ).encrypt(user.id, {
    accessToken: 'expired',
    refreshToken: 'synthetic-refresh',
    expiresAt: 0,
  });
  await source.query(
    'UPDATE classroom_connections SET encrypted_tokens=? WHERE user_id=?',
    [encrypted, user.id],
  );
  expect(await oauth.access(user.id, 1, [classroomScopes.courses])).toBe(
    'synthetic-refreshed-access',
  );
  await source.query(
    'UPDATE classroom_connections SET encrypted_tokens=? WHERE user_id=?',
    [encrypted, user.id],
  );
  fixture.state.refreshUnavailable = true;
  await expect(oauth.access(user.id, 1, [])).rejects.toMatchObject({
    code: 'CLASSROOM_TEMPORARILY_UNAVAILABLE',
  });
  expect((await runtime.service.status(user.id)).state).toBe('connected');
  expect(
    (await runtime.service.repository.connection(user.id))!.encrypted_tokens,
  ).toBe(encrypted);
  fixture.state.refreshUnavailable = false;
  fixture.state.refreshRejected = true;
  await expect(oauth.access(user.id, 1, [])).rejects.toMatchObject({
    code: 'CLASSROOM_RECONNECT_REQUIRED',
  });
  expect((await runtime.service.status(user.id)).state).toBe(
    'reconnect_required',
  );
  expect(
    (await runtime.service.repository.connection(user.id))!.encrypted_tokens,
  ).toBeNull();
});
it('rejects missing Classroom scope and a callback after disconnect without retaining tokens', async () => {
  const user = await account(false),
    session = { userId: user.id, id: randomUUID() },
    fixture = classroomOIDCFixture(),
    oauth = new ClassroomOAuthService(
      runtime.service.repository,
      env,
      fixture.transport,
    );
  let started = await oauth.start(session, 'import');
  let authorization = new URL(started.url);
  fixture.state.nonce = authorization.searchParams.get('nonce')!;
  fixture.state.scope = classroomScopes.courses;
  const callback = new URL(
    `${env.API_PUBLIC_ORIGIN}/integrations/google-classroom/callback`,
  );
  callback.searchParams.set('code', 'synthetic-code');
  callback.searchParams.set('state', authorization.searchParams.get('state')!);
  await expect(
    oauth.callback(session, callback, started.browserSecret),
  ).rejects.toMatchObject({ code: 'CLASSROOM_SCOPES_MISSING' });
  expect((await runtime.service.status(user.id)).state).toBe('disconnected');
  started = await oauth.start(session, 'import');
  authorization = new URL(started.url);
  fixture.state.nonce = authorization.searchParams.get('nonce')!;
  fixture.state.scope = Object.values(classroomScopes).join(' ');
  callback.searchParams.set('state', authorization.searchParams.get('state')!);
  await runtime.service.repository.disconnect(user.id);
  await expect(
    oauth.callback(session, callback, started.browserSecret),
  ).rejects.toMatchObject({ code: 'CLASSROOM_CONNECTION_CHANGED' });
  expect(
    (await runtime.service.repository.connection(user.id))!.encrypted_tokens,
  ).toBeNull();
});

it('keeps tokens removed when remote revocation fails and clears selections on identity change', async () => {
  const user = await account();
  await prefs.update(user.id, { subjects: false });
  await runtime.service.select(user.id, {
    courses: [{ courseId: course.id, destination: { kind: 'none' } }],
  });
  const revoke = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 503 }),
  );
  vi.stubGlobal('fetch', revoke);
  try {
    expect(await runtime.service.oauth.disconnect(user.id)).toEqual({
      revocationConfirmed: false,
    });
  } finally {
    vi.unstubAllGlobals();
  }
  expect(
    (await runtime.service.repository.connection(user.id))!.encrypted_tokens,
  ).toBeNull();
  expect((await runtime.service.status(user.id)).state).toBe('disconnected');
  const current = (await runtime.service.repository.connection(user.id))!;
  const encrypted = new ClassroomTokenCrypto(
    env.CLASSROOM_ENCRYPTION_KEY,
  ).encrypt(user.id, {
    accessToken: 'new-synthetic-token',
    expiresAt: Date.now() + 3600000,
  });
  await runtime.service.repository.saveConnection(
    user.id,
    current.version,
    'another-google-sub',
    'another@example.test',
    Object.values(classroomScopes),
    encrypted,
  );
  expect((await runtime.service.selection(user.id)).courses).toHaveLength(0);
  expect(revoke).toHaveBeenCalledTimes(1);
});

it('imports with AI enabled using only Classroom metadata and exposes no file-generation routes', async () => {
  const user = await account();
  await prefs.update(user.id, { ai: true, subjects: false });
  transport.mockClear();
  await runtime.service.select(user.id, {
    courses: [{ courseId: course.id, destination: { kind: 'none' } }],
  });
  const job = await runtime.service.start(user.id, 'import', {
    requestId: randomUUID(),
    courseIds: [course.id],
  });
  await runtime.service.runOnce();
  expect(
    (await runtime.service.operations.result(user.id, job.operation.id, 1, 20))
      .operation.state,
  ).toBe('completed');
  expect(
    transport.mock.calls.every(
      ([url]) => new URL(String(url)).hostname === 'classroom.googleapis.com',
    ),
  ).toBe(true);
  expect(
    transport.mock.calls.some(([url]) =>
      /drive|courseWorkMaterials|generateContent/.test(String(url)),
    ),
  ).toBe(false);
  expect(
    (
      await write(
        'post',
        '/integrations/google-classroom/connect',
        user.cookie,
        { purpose: 'notes' },
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await write(
        'post',
        '/integrations/google-classroom/note-generations',
        user.cookie,
        {},
      )
    ).status,
  ).toBe(404);
  await prefs.update(user.id, { subjects: true });
  expect(
    (
      await request(app)
        .get(`/subjects/${randomUUID()}/notes`)
        .set('Cookie', user.cookie)
    ).status,
  ).toBe(404);
});

it('never requests obsolete file grants when reconnecting a pre-release connection', async () => {
  const user = await account();
  await source.query(
    'UPDATE classroom_connections SET scopes=? WHERE user_id=?',
    [
      JSON.stringify([
        ...Object.values(classroomScopes),
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
      ]),
      user.id,
    ],
  );
  const oauth = new ClassroomOAuthService(
    runtime.service.repository,
    env,
    classroomOIDCFixture().transport,
  );
  const started = await oauth.start(
    { userId: user.id, id: randomUUID() },
    'teacher',
  );
  const scopes = new URL(started.url).searchParams.get('scope')!;
  expect(scopes).toContain(classroomScopes.teacherCoursework);
  expect(scopes).not.toContain('drive');
  expect(scopes).not.toContain('courseworkmaterials');
});
