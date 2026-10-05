import { randomBytes } from 'node:crypto';
import pino from 'pino';
import request from 'supertest';
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  studyAnalyticsSchema,
  studyProgressSchema,
} from '@study-platform/contracts';
import { loadEnv, parseEnv } from '../src/config/env.js';
import { allowsWebOrigin } from '../src/config/origins.js';
import { createDataSource } from '../src/database/data-source.js';
import { createApp } from '../src/app.js';
import {
  demoTables,
  demoTarget,
  requireConfirmation,
  requireDemoEnvironment,
  requireDemoSchema,
  truncateDemo,
  withDemoLock,
} from '../src/demo/database.js';
import {
  demoDate,
  demoId,
  demoPassword,
  demoProfiles,
  seedDemo,
} from '../src/demo/seed.js';

const env = loadEnv();
const database = `${env.TEST_DB_NAME}_demo_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
const lan = 'http://192.168.15.12:5173';
const demoEnv = {
  ...env,
  NODE_ENV: 'development' as const,
  DEV_WEB_ORIGINS: [lan],
};
const clock = () => new Date('2026-10-03T20:00:00Z');
const app = createApp({
  logger: pino({ level: 'silent' }),
  source,
  env: demoEnv,
  webOrigin: env.WEB_ORIGIN,
  progressClock: clock,
  dashboardClock: clock,
  reviewClock: clock,
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
beforeEach(async () => {
  await reset();
});

async function reset() {
  await withDemoLock(source, truncateDemo);
}
async function counts() {
  const result: Record<string, number> = {};
  for (const table of demoTables) {
    const rows = await source.query<Array<{ total: number }>>(
      `SELECT COUNT(*) AS total FROM \`${table}\``,
    );
    result[table] = Number(rows[0]!.total);
  }
  return result;
}
async function schema() {
  const rows = await source.query(
    'SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION',
    [database],
  );
  const keys = await source.query(
    'SELECT TABLE_NAME,CONSTRAINT_NAME,CONSTRAINT_TYPE FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,CONSTRAINT_NAME',
    [database],
  );
  const indexes = await source.query(
    'SELECT TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX,COLUMN_NAME,NON_UNIQUE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX',
    [database],
  );
  const triggers = await source.query(
    'SELECT TRIGGER_NAME,ACTION_STATEMENT FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA=? ORDER BY TRIGGER_NAME',
    [database],
  );
  return { rows, keys, indexes, triggers };
}
async function login(profile: string, origin = lan) {
  const agent = request.agent(app);
  const response = await agent
    .post('/auth/login')
    .set('Origin', origin)
    .send({ email: `${profile}@demo.edutrack.test`, password: demoPassword });
  expect(response.status).toBe(200);
  expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
  expect(response.headers['set-cookie']?.[0]).toContain('SameSite=Lax');
  expect((await agent.get('/auth/me')).status).toBe(200);
  return agent;
}

describe.sequential('local demo using isolated real MySQL', () => {
  it('rejects unsafe environment/targets and invalid dates; production ignores LAN additions', () => {
    for (const NODE_ENV of ['test', 'production'] as const)
      expect(() => requireDemoEnvironment({ ...demoEnv, NODE_ENV })).toThrow();
    for (const DB_HOST of ['remote.example', '192.168.1.1'])
      expect(() => requireDemoEnvironment({ ...demoEnv, DB_HOST })).toThrow();
    for (const DB_NAME of [
      'mysql',
      'sys',
      'information_schema',
      env.TEST_DB_NAME,
    ])
      expect(() => requireDemoEnvironment({ ...demoEnv, DB_NAME })).toThrow();
    expect(() => requireConfirmation(demoEnv)).toThrow();
    expect(() => requireConfirmation(demoEnv, 'incorrect')).toThrow();
    expect(() =>
      requireConfirmation(demoEnv, demoTarget(demoEnv)),
    ).not.toThrow();
    for (const date of ['2026-02-30', 'oops', '2026-01-01T00:00:00Z'])
      expect(() => demoDate(date)).toThrow();
    expect(allowsWebOrigin(demoEnv, lan)).toBe(true);
    expect(allowsWebOrigin({ ...demoEnv, NODE_ENV: 'production' }, lan)).toBe(
      false,
    );
    expect(() =>
      parseEnv({ ...process.env, DEV_WEB_ORIGINS: 'http://host/path' }),
    ).toThrow();
  });

  it('preserves full schema and migrations and rejects unknown tables', async () => {
    const before = await schema();
    const migrations = await source.query(
      'SELECT * FROM migrations ORDER BY id',
    );
    await seedDemo(source, '2026-10-03');
    await reset();
    expect(await schema()).toEqual(before);
    expect(await source.query('SELECT * FROM migrations ORDER BY id')).toEqual(
      migrations,
    );
    expect(Object.values(await counts()).every((count) => count === 0)).toBe(
      true,
    );
    await source.query('CREATE TABLE unexpected_demo_table(id int)');
    try {
      await expect(requireDemoSchema(source)).rejects.toThrow('Inventário');
    } finally {
      await source.query('DROP TABLE unexpected_demo_table');
    }
    await requireDemoSchema(source);
  });

  it('restores foreign key checks after an actual partial truncate failure', async () => {
    await source.query('RENAME TABLE auth_rate_limits TO temporarily_missing');
    try {
      await withDemoLock(source, async (runner) => {
        await expect(truncateDemo(runner)).rejects.toThrow('parcial');
        const rows = await runner.manager.query<Array<{ enabled: number }>>(
          'SELECT @@SESSION.FOREIGN_KEY_CHECKS AS enabled',
        );
        expect(Number(rows[0]!.enabled)).toBe(1);
      });
    } finally {
      await source.query(
        'RENAME TABLE temporarily_missing TO auth_rate_limits',
      );
    }
  });

  it('rolls back an actual seed failure and refuses to duplicate populated data', async () => {
    await source.query(
      "CREATE TRIGGER reject_demo_subject BEFORE INSERT ON study_subjects FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test failure'",
    );
    try {
      await expect(seedDemo(source, '2026-10-03')).rejects.toThrow();
    } finally {
      await source.query('DROP TRIGGER reject_demo_subject');
    }
    expect((await counts()).users).toBe(0);
    expect((await counts()).study_progress_tracking).toBe(0);
    await seedDemo(source, '2026-10-03');
    const first = await counts();
    await expect(seedDemo(source, '2026-10-03')).rejects.toThrow(
      'contém dados',
    );
    expect(await counts()).toEqual(first);
    await reset();
    await seedDemo(source, '2026-10-03');
    expect(await counts()).toEqual(first);
    expect(first.email_outbox).toBe(0);
    expect(first.study_achievement_grants).toBeGreaterThan(7);
  });

  it('authenticates all profiles, validates module data, chronology and derived progress', async () => {
    await seedDemo(source, '2026-10-03');
    for (const profile of demoProfiles) {
      const agent = await login(profile);
      for (const path of [
        '/profile',
        '/tasks',
        '/subjects',
        '/routines',
        '/pomodoro/sessions',
        '/flashcard-decks',
        '/flashcard-decks/reviews/pending',
        '/dashboard',
      ])
        expect((await agent.get(path)).status, `${profile} ${path}`).toBe(200);
      const progress = studyProgressSchema.parse(
        (await agent.get('/study-progress')).body,
      );
      if (profile === 'ativo') {
        expect(progress.currentStreak).toBeGreaterThanOrEqual(7);
        expect(
          progress.achievements.every((achievement) => achievement.earnedAt),
        ).toBe(true);
        const subject = demoId('ativo:subject:0');
        const roadmap = demoId('ativo:roadmap:0');
        expect(
          (await agent.get(`/subjects/${subject}/roadmaps/${roadmap}`)).status,
        ).toBe(200);
        expect(
          (
            await agent.get(
              `/subjects/${subject}/roadmaps/${roadmap}/revisions`,
            )
          ).status,
        ).toBe(200);
        const importClock = vi
          .spyOn(Date, 'now')
          .mockReturnValue(clock().getTime());
        try {
          expect(
            (
              await agent.get(
                `/decks/${demoId('ativo:deck:0')}/imports/${demoId('ativo:import:0')}`,
              )
            ).status,
          ).toBe(200);
        } finally {
          importClock.mockRestore();
        }
      } else if (profile === 'iniciante') {
        expect(progress.activeDays).toBe(0);
        expect((await agent.get('/flashcard-decks')).body.items).toHaveLength(
          0,
        );
      }
      const analytics = await agent.get(
        '/analytics/study?granularity=week&date=2026-10-03&timeZone=America%2FSao_Paulo',
      );
      expect(analytics.status).toBe(200);
      const stats = studyAnalyticsSchema.parse(analytics.body);
      expect(stats.metrics.tasks?.currentStatus).toBe('available');
      await agent.post('/auth/logout').set('Origin', lan).send({}).expect(204);
      await agent.get('/auth/me').expect(401);
    }
    const orphanGrants = await source.query<Array<{ total: number }>>(
      'SELECT COUNT(*) total FROM study_achievement_grants g LEFT JOIN study_activity_events e ON e.id=g.triggering_event_id AND e.user_id=g.user_id WHERE e.id IS NULL',
    );
    expect(Number(orphanGrants[0]!.total)).toBe(0);
    const invalidHistory = await source.query<Array<{ total: number }>>(
      'SELECT COUNT(*) total FROM flashcard_review_events e JOIN flashcards c ON c.id=e.card_id WHERE e.reviewed_at<c.created_at OR e.due_at<=e.reviewed_at',
    );
    expect(Number(invalidHistory[0]!.total)).toBe(0);
  });

  it('rejects cross-user reads/writes and unauthorized origins while LAN mutations work', async () => {
    await seedDemo(source, '2026-10-03');
    for (const profile of demoProfiles) {
      const agent = await login(profile);
      const other = profile === 'ativo' ? 'intermediario' : 'ativo';
      for (const path of [
        `/tasks/${demoId(`${other}:task:0`)}`,
        `/subjects/${demoId(`${other}:subject:0`)}`,
        `/flashcard-decks/${demoId(`${other}:deck:0`)}`,
      ]) {
        await agent.get(path).expect(404);
        await agent
          .patch(path)
          .set('Origin', lan)
          .send(
            path.startsWith('/tasks')
              ? { title: 'Forbidden' }
              : { name: 'Forbidden' },
          )
          .expect(404);
      }
      const task = `/tasks/${demoId(`${profile}:task:0`)}`;
      await agent
        .patch(task)
        .set('Origin', 'http://evil.example')
        .send({ title: 'Forbidden' })
        .expect(403);
      await agent
        .patch(task)
        .set('Origin', lan)
        .send({ title: 'Atualização via LAN' })
        .expect(200);
      await agent
        .patch('/profile')
        .set('Origin', lan)
        .send({ displayName: 'Nome local' })
        .expect(200);
      await agent
        .put('/profile/avatar')
        .set('Origin', 'http://evil.example')
        .set('Content-Type', 'image/png')
        .send(Buffer.from('bad'))
        .expect(403);
    }
  });
});
