import { randomBytes, randomUUID } from 'node:crypto';
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import pino from 'pino';
import request from 'supertest';
import { aiModels, flattenRoadmap } from '@study-platform/contracts';
import type { AIProvider, Roadmap } from '@study-platform/contracts';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { AIUsageRepository } from '../src/modules/ai-settings/ai-usage.repository.js';
import { AISettingsService } from '../src/modules/ai-settings/ai-settings.service.js';
import { AISettingsRepository } from '../src/modules/ai-settings/ai-settings.repository.js';
import {
  providerEnvelope,
  roadmapFixture,
  suffixFixture,
  flashcardFixture,
} from './ai-provider-fixtures.js';
const canary = 'SYNTHETIC_SETTINGS_CANARY_123456789';
const env = {
  ...loadEnv(),
  GEMINI_API_KEY: 'SYNTHETIC_PLATFORM_KEY_123456789',
  GEMINI_MODEL: 'gemini-3.8-flash',
  AI_RECEIPT_KEY: 'c'.repeat(64),
  AI_USER_REQUESTS_PER_MINUTE: 100,
  AI_DEFAULT_USER_DAILY_LIMIT: 100,
  AI_DEFAULT_GLOBAL_DAILY_LIMIT: 1000,
};
const database = `${env.TEST_DB_NAME}_ais_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let output: unknown = flashcardFixture;
let logs = '';
const boundary = vi.fn<typeof fetch>(async (url, options) => {
  const provider: AIProvider = String(url).includes('googleapis')
    ? 'gemini'
    : String(url).includes('anthropic')
      ? 'claude'
      : String(url).includes('deepseek')
        ? 'deepseek'
        : String(url).includes('moonshot')
          ? 'kimi'
          : 'openai';
  expect(String(options?.body)).not.toMatch(
    /SYNTHETIC_.*KEY|SYNTHETIC_SETTINGS_CANARY/,
  );
  return Response.json(providerEnvelope(provider, output));
});
const logger = pino(
  { level: 'info' },
  {
    write(chunk: string) {
      logs += chunk;
    },
  },
);
const app = createApp({
  logger,
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
  aiFetch: boundary,
});
const noDefault = createApp({
  logger,
  webOrigin: env.WEB_ORIGIN,
  source,
  env: { ...env, GEMINI_API_KEY: undefined, GEMINI_MODEL: undefined },
  aiFetch: boundary,
});
const service = new AISettingsService(new AISettingsRepository(source), env);
const read = (cookie: string, path = '/profile/ai') =>
  request(app).get(path).set('Cookie', cookie);
const write = (
  cookie: string,
  body: object,
  method: 'put' | 'delete' = 'put',
) =>
  request(app)
    [method]('/profile/ai')
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .send(body);
const post = (cookie: string, path: string, body: object, target = app) =>
  request(target)
    .post(path)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .send(body);
async function account() {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.test`,
    id,
    `${id}@example.test`,
  );
  const cookie = `edutrack_session=${await new SessionRepository(source).create(user.id)}`;
  await new PreferencesService(source).update(user.id, { ai: true });
  return { user, cookie };
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

it('applies/rolls back the migration idempotently while preserving existing accounts and cascades settings and leases', async () => {
  const a = await account();
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  await source.undoLastMigration();
  expect(
    await source.query('SELECT id FROM users WHERE id = ?', [a.user.id]),
  ).toHaveLength(1);
  expect(await source.runMigrations()).toHaveLength(1);
  await service.update(a.user.id, {
    mode: 'personal',
    revision: 0,
    provider: 'gemini',
    model: aiModels.gemini[0],
    apiKey: canary,
  });
  const release = await new AIUsageRepository(source, env).reserve(
    a.user.id,
    false,
  );
  await source.query('DELETE FROM users WHERE id = ?', [a.user.id]);
  expect(
    await source.query(
      'SELECT user_id FROM user_ai_settings WHERE user_id = ?',
      [a.user.id],
    ),
  ).toHaveLength(0);
  expect(
    await source.query(
      'SELECT user_id FROM ai_usage_leases WHERE user_id = ?',
      [a.user.id],
    ),
  ).toHaveLength(0);
  await release();
});
it('protects all routes, emits no-store explicit DTOs and keeps account keys private through every lifecycle operation', async () => {
  const a = await account(),
    b = await account();
  for (const path of ['/profile/ai', '/profile/ai/catalog'])
    expect((await request(app).get(path)).status).toBe(401);
  expect(
    (
      await request(app)
        .put('/profile/ai')
        .set('Cookie', a.cookie)
        .set('Origin', 'https://attacker.test')
        .send({})
    ).status,
  ).toBe(403);
  const initial = await read(a.cookie);
  expect(initial.body).toMatchObject({
    mode: 'platform',
    provider: 'gemini',
    revision: 0,
    hasPersonalKey: false,
  });
  expect(initial.headers['cache-control']).toBe('no-store');
  expect(
    (await read(a.cookie, '/profile/ai/catalog')).body.providers,
  ).toHaveLength(5);
  const base = {
    mode: 'personal',
    revision: 0,
    provider: 'openai',
    model: aiModels.openai[0],
    apiKey: canary,
  };
  for (const patch of [
    { userId: b.user.id },
    { url: 'https://attacker.test' },
    { provider: 'invalid' },
    { model: aiModels.gemini[0] },
    { apiKey: '' },
  ])
    expect((await write(a.cookie, { ...base, ...patch })).status).toBe(400);
  const created = await write(a.cookie, base);
  expect(created.status).toBe(200);
  expect(Object.keys(created.body).sort()).toEqual([
    'hasPersonalKey',
    'mode',
    'model',
    'platformAvailable',
    'provider',
    'revision',
  ]);
  expect((await read(b.cookie)).body.hasPersonalKey).toBe(false);
  const persisted = await source.query(
    'SELECT * FROM user_ai_settings WHERE user_id = ?',
    [a.user.id],
  );
  expect(JSON.stringify(persisted)).not.toContain(canary);
  expect(persisted[0].ciphertext.toString('utf8')).not.toContain(canary);
  expect((await service.resolve(a.user.id)).credential).toBe(canary);
  expect(
    (
      await write(a.cookie, {
        ...base,
        apiKey: undefined,
        model: aiModels.openai[1],
        revision: 1,
      })
    ).status,
  ).toBe(200);
  expect((await service.resolve(a.user.id)).credential).toBe(canary);
  expect(
    (
      await write(a.cookie, {
        mode: 'personal',
        revision: 2,
        provider: 'claude',
        model: aiModels.claude[0],
      })
    ).status,
  ).toBe(400);
  const updates = await Promise.all([
    write(a.cookie, { ...base, revision: 2 }),
    write(a.cookie, { ...base, revision: 2 }),
  ]);
  expect(updates.map((r) => r.status).sort()).toEqual([200, 409]);
  expect((await write(a.cookie, { revision: 3 }, 'delete')).body).toMatchObject(
    { revision: 4, mode: 'platform', hasPersonalKey: false },
  );
  expect(
    (
      await source.query(
        'SELECT ciphertext FROM user_ai_settings WHERE user_id = ?',
        [a.user.id],
      )
    )[0].ciphertext,
  ).toBeNull();
  expect(boundary).not.toHaveBeenCalled();
  expect(
    JSON.stringify([initial.body, created.body, (await read(a.cookie)).body]) +
      logs,
  ).not.toContain(canary);
});
it.each(Object.keys(aiModels) as AIProvider[])(
  'routes %s for roadmaps, regeneration and flashcards; confirms previews after provider change without generation',
  async (provider) => {
    const a = await account();
    boundary.mockClear();
    await service.update(a.user.id, {
      mode: 'personal',
      revision: 0,
      provider,
      model: aiModels[provider][0],
      apiKey: canary,
    });
    const subject = await post(a.cookie, '/subjects', {
      name: 'Matéria',
      currentLevel: 'BEGINNER',
      objective: 'Aprender',
      dueDate: '2027-01-01',
      weeklyHours: 2,
      knownTopics: [],
    });
    expect(subject.status).toBe(201);
    output = roadmapFixture;
    const preview = await post(
      a.cookie,
      `/subjects/${subject.body.id}/roadmap-generations`,
      {
        currentLevel: 'BEGINNER',
        objective: 'Aprender',
        dueDate: '2027-01-01',
        weeklyHours: 2,
        knownTopics: [],
      },
    );
    expect(preview.status).toBe(200);
    const confirmed = await post(
      a.cookie,
      `/subjects/${subject.body.id}/roadmaps/confirm-ai`,
      {
        confirm: true,
        receipt: preview.body.receipt,
        content: preview.body.content,
      },
    );
    expect(confirmed.status).toBe(201);
    const roadmap = confirmed.body as Roadmap;
    const steps = flattenRoadmap(roadmap);
    output = suffixFixture;
    const revision = await post(
      a.cookie,
      `/subjects/${subject.body.id}/roadmaps/${roadmap.id}/step-regenerations`,
      {
        baseRevision: roadmap.revision,
        movedStepId: steps[1]!.id,
        pendingOrder: [steps[1]!.id, steps[0]!.id, steps[2]!.id],
      },
    );
    expect(revision.status).toBe(200);
    const deck = await post(a.cookie, '/flashcard-decks', { name: 'Baralho' });
    output = flashcardFixture;
    const cards = await post(
      a.cookie,
      `/flashcard-decks/${deck.body.id}/ai-generations`,
      { text: 'Conteúdo' },
    );
    expect(cards.status).toBe(200);
    expect(boundary).toHaveBeenCalledTimes(3);
    const hosts = {
      gemini: 'generativelanguage.googleapis.com',
      claude: 'api.anthropic.com',
      openai: 'api.openai.com',
      deepseek: 'api.deepseek.com',
      kimi: 'api.moonshot.ai',
    };
    for (const [url, options] of boundary.mock.calls) {
      expect(new URL(String(url)).hostname).toBe(hosts[provider]);
      const headers = new Headers(options!.headers);
      expect(
        headers.get(
          provider === 'gemini'
            ? 'x-goog-api-key'
            : provider === 'claude'
              ? 'x-api-key'
              : 'authorization',
        ),
      ).toContain(canary);
    }
    await service.update(a.user.id, { mode: 'platform', revision: 1 });
    boundary.mockClear();
    for (let index = 0; index < 2; index++)
      expect(
        (
          await post(
            a.cookie,
            `/flashcard-decks/${deck.body.id}/ai-generations/confirm`,
            {
              deckId: deck.body.id,
              receipt: cards.body.receipt,
              cards: cards.body.cards,
            },
          )
        ).status,
      ).toBe(200);
    expect(boundary).not.toHaveBeenCalled();
    // Restoring platform does not invalidate already issued receipts.
    expect(
      (
        await post(
          a.cookie,
          `/subjects/${subject.body.id}/roadmaps/confirm-ai`,
          {
            confirm: true,
            receipt: preview.body.receipt,
            content: preview.body.content,
          },
        )
      ).status,
    ).toBe(201);
    expect(boundary).not.toHaveBeenCalled();
  },
);
it('allows personal generation without a platform key and rejects disabled or foreign resources before HTTP', async () => {
  const a = await account(),
    b = await account();
  const deck = await post(a.cookie, '/flashcard-decks', { name: 'Próprio' });
  const path = `/flashcard-decks/${deck.body.id}/ai-generations`;
  boundary.mockClear();
  expect(
    (await post(a.cookie, path, { text: 'Estudo' }, noDefault)).status,
  ).toBe(503);
  expect(boundary).not.toHaveBeenCalled();
  await service.update(a.user.id, {
    mode: 'personal',
    provider: 'openai',
    model: aiModels.openai[0],
    revision: 0,
    apiKey: canary,
  });
  output = flashcardFixture;
  expect(
    (await post(a.cookie, path, { text: 'Estudo' }, noDefault)).status,
  ).toBe(200);
  boundary.mockClear();
  expect((await post(b.cookie, path, { text: 'Estudo' })).status).toBe(404);
  await new PreferencesService(source).update(a.user.id, { ai: false });
  expect((await post(a.cookie, path, { text: 'Estudo' })).status).toBe(403);
  expect(boundary).not.toHaveBeenCalled();
});
it('reserves the final global quota across two connections, keeps personal budget separate and resets UTC windows with crash-expiring leases', async () => {
  const a = await account(),
    b = await account();
  const second = createDataSource({ ...env, DB_NAME: database });
  await second.initialize();
  let now = new Date('2035-01-01T23:59:59Z');
  const limits = {
    ...env,
    AI_USER_REQUESTS_PER_MINUTE: 2,
    AI_USER_MAX_CONCURRENCY: 1,
    AI_DEFAULT_GLOBAL_DAILY_LIMIT: 1,
    AI_DEFAULT_USER_DAILY_LIMIT: 1,
    AI_DEFAULT_GLOBAL_MAX_CONCURRENCY: 1,
  };
  const one = new AIUsageRepository(source, limits, () => now),
    two = new AIUsageRepository(second, limits, () => now);
  try {
    const attempts = await Promise.allSettled([
      one.reserve(a.user.id, true),
      two.reserve(b.user.id, true),
    ]);
    expect(attempts.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const winner = attempts.find((r) => r.status === 'fulfilled');
    if (winner?.status === 'fulfilled') await winner.value();
    await expect(one.reserve(a.user.id, true)).rejects.toHaveProperty(
      'code',
      'AI_LIMIT_REACHED',
    );
    const release = await two.reserve(b.user.id, false);
    await expect(one.reserve(b.user.id, false)).rejects.toHaveProperty(
      'code',
      'AI_LIMIT_REACHED',
    );
    await release();
    const before = await source.query(
      "SELECT calls FROM ai_usage_counters WHERE scope='global' AND window_key='day:2035-01-01'",
    );
    expect(before[0].calls).toBe(1);
    now = new Date('2035-01-02T00:00:00Z');
    await one.reserve(a.user.id, true); // Simulate process crash without release.
    now = new Date(now.getTime() + env.AI_TIMEOUT_MS + 10001);
    const afterCrash = await two.reserve(a.user.id, false);
    await afterCrash();
    await expect(two.reserve(a.user.id, false)).rejects.toHaveProperty(
      'code',
      'AI_LIMIT_REACHED',
    );
    now = new Date('2035-01-02T00:02:00Z');
    const nextMinute = await one.reserve(a.user.id, false);
    await nextMinute();
  } finally {
    await second.destroy();
  }
});

it('enforces global concurrency separately from daily budgets and the per-account daily limit separately from global usage', async () => {
  const a = await account(),
    b = await account();
  let now = new Date('2036-01-01T12:00:00Z');
  const limits = {
    ...env,
    AI_DEFAULT_GLOBAL_MAX_CONCURRENCY: 1,
    AI_DEFAULT_GLOBAL_DAILY_LIMIT: 100,
    AI_DEFAULT_USER_DAILY_LIMIT: 1,
  };
  const usage = new AIUsageRepository(source, limits, () => now);
  const release = await usage.reserve(a.user.id, true);
  await expect(usage.reserve(b.user.id, true)).rejects.toHaveProperty(
    'code',
    'AI_LIMIT_REACHED',
  );
  await release();
  const releaseB = await usage.reserve(b.user.id, true);
  await releaseB();
  now = new Date('2036-01-01T12:02:00Z');
  await expect(usage.reserve(a.user.id, true)).rejects.toHaveProperty(
    'code',
    'AI_LIMIT_REACHED',
  );
  const personal = await usage.reserve(a.user.id, false);
  await personal();
});

it.each(Object.keys(aiModels) as AIProvider[])(
  'never reflects %s credentials in HTTP errors, previews or request logs',
  async (provider) => {
    const a = await account();
    await service.update(a.user.id, {
      mode: 'personal',
      provider,
      model: aiModels[provider][0],
      revision: 0,
      apiKey: canary,
    });
    const deck = await post(a.cookie, '/flashcard-decks', { name: 'Privado' });
    const path = `/flashcard-decks/${deck.body.id}/ai-generations`;
    boundary.mockImplementationOnce(
      async () =>
        new Response(`upstream Authorization: Bearer ${canary}`, {
          status: 401,
        }),
    );
    const error = await post(a.cookie, path, { text: 'Estudo' });
    expect(error.status).toBe(422);
    expect(error.body.error.code).toBe('AI_CREDENTIAL_REJECTED');
    output = { cards: [{ front: canary, back: 'Refletida' }] };
    const reflected = await post(a.cookie, path, { text: 'Estudo' });
    expect(reflected.status).toBe(502);
    expect(
      JSON.stringify([
        error.body,
        reflected.body,
        (await read(a.cookie)).body,
      ]) + logs,
    ).not.toContain(canary);
    expect(
      (await read(a.cookie, `/flashcard-decks/${deck.body.id}/cards`)).body
        .total,
    ).toBe(0);
  },
);
