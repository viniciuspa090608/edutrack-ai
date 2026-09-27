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
import { CreateSpacedRepetition20260926235000 } from '../src/database/migrations/20260926235000-CreateSpacedRepetition.js';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_reviews_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });

let now = new Date('2026-10-01T12:00:00Z');
const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
  reviewClock: () => now,
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
async function setup() {
  const a = await account();
  const deck = (
    await write('post', '/flashcard-decks', a.cookie, { name: 'Revisão' })
  ).body;
  const card = (
    await write('post', `/flashcard-decks/${deck.id}/cards`, a.cookie, {
      front: 'Pergunta',
      back: 'Resposta secreta',
    })
  ).body;
  return { ...a, deckId: deck.id as string, cardId: card.id as string };
}
const path = (a: { deckId: string; cardId: string }) =>
  `/flashcard-decks/${a.deckId}/cards/${a.cardId}`;
const state = async (a: Awaited<ReturnType<typeof setup>>) =>
  (await read(`${path(a)}/review-state`, a.cookie)).body;
const rate = (
  a: Awaited<ReturnType<typeof setup>>,
  rating = 'GOOD',
  expectedRevision = 1,
  idempotencyKey = randomUUID(),
) =>
  write('post', `${path(a)}/reviews`, a.cookie, {
    rating,
    expectedRevision,
    idempotencyKey,
  });
it('migrates existing cards with idempotent backfill and rolls back without deleting cards', async () => {
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  await source.undoLastMigration();
  const a = await account(),
    deckId = randomUUID(),
    cardId = randomUUID();
  await source.query(
    "INSERT INTO flashcard_decks (id,user_id,name) VALUES (?,?,'Anterior')",
    [deckId, a.id],
  );
  await source.query(
    "INSERT INTO flashcards (id,deck_id,front,back) VALUES (?,?,'Anterior','Resposta')",
    [cardId, deckId],
  );
  const before = new Date();
  expect(await source.runMigrations()).toHaveLength(1);
  const row = (
    await read(
      `/flashcard-decks/${deckId}/cards/${cardId}/review-state`,
      a.cookie,
    )
  ).body;
  expect(row).toMatchObject({
    revision: 1,
    contentGeneration: 1,
    policyId: 'sm2-inspired',
    policyVersion: 1,
    policyState: {
      intervalSeconds: 0,
      ease: 2.5,
      successStreak: 0,
      consolidated: false,
    },
  });
  expect(new Date(row.dueAt).getTime()).toBeGreaterThanOrEqual(
    before.getTime() - 10,
  );
  const runner = source.createQueryRunner();
  try {
    await CreateSpacedRepetition20260926235000.backfillReviewStates(runner);
    await CreateSpacedRepetition20260926235000.backfillReviewStates(runner);
  } finally {
    await runner.release();
  }
  expect(
    await source.query(
      'SELECT card_id FROM flashcard_review_states WHERE card_id=?',
      [cardId],
    ),
  ).toHaveLength(1);
  expect(await source.query('SELECT id FROM flashcard_review_events')).toEqual(
    [],
  );
  await source.undoLastMigration();
  expect(
    await source.query("SHOW TABLES LIKE 'flashcard_review_states'"),
  ).toEqual([]);
  expect(
    await source.query('SELECT id FROM flashcards WHERE id=?', [cardId]),
  ).toHaveLength(1);
  expect(await source.runMigrations()).toHaveLength(1);
});
it('creates initial state atomically from manual and imported cards and paginates due cards without backs', async () => {
  const a = await setup(),
    b = await setup();
  await new PreferencesService(source).update(a.id, { ai: false });
  const upload = await request(app)
    .post(`/decks/${a.deckId}/imports?format=csv`)
    .set('Cookie', a.cookie)
    .set('Origin', env.WEB_ORIGIN)
    .set('Content-Type', 'text/csv')
    .send('a,b\nImported,Answer');
  expect(upload.status).toBe(201);
  const attempt = `/decks/${a.deckId}/imports/${upload.body.id}`;
  await write('put', `${attempt}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  expect(
    (await write('post', `${attempt}/confirm`, a.cookie, { confirm: true }))
      .status,
  ).toBe(200);
  const queue = (
    await read(
      `/flashcard-decks/reviews/pending?deckId=${a.deckId}&pageSize=1`,
      a.cookie,
    )
  ).body;
  expect(queue.total).toBe(2);
  expect(queue.totalPages).toBe(2);
  expect(queue.items[0]).not.toHaveProperty('back');
  const page2 = (
    await read(
      `/flashcard-decks/reviews/pending?deckId=${a.deckId}&pageSize=1&page=2`,
      a.cookie,
    )
  ).body;
  expect(page2.items[0].id).not.toBe(queue.items[0].id);
  expect(
    (
      await read(
        `/flashcard-decks/reviews/pending?deckId=${a.deckId}`,
        b.cookie,
      )
    ).status,
  ).toBe(404);
  const detail = await read(`${path(a)}/review`, a.cookie);
  expect(detail.body.card.back).toBe('Resposta secreta');
  expect(detail.body.state.revision).toBe(1);
  expect(detail.body.state.dueAt).toBe(detail.body.card.createdAt);
  const ordered = [queue.items[0], page2.items[0]];
  expect(ordered).toEqual(
    [...ordered].sort(
      (left, right) =>
        left.dueAt.localeCompare(right.dueAt) ||
        left.id.localeCompare(right.id),
    ),
  );
  const ownQueue = (await read('/flashcard-decks/reviews/pending', b.cookie))
    .body;
  expect(ownQueue.items.map((item: { id: string }) => item.id)).toEqual([
    b.cardId,
  ]);
  const old = await state(a);
  const failedUpload = await request(app)
    .post(`/decks/${a.deckId}/imports?format=csv`)
    .set('Cookie', a.cookie)
    .set('Origin', env.WEB_ORIGIN)
    .set('Content-Type', 'text/csv')
    .send('a,b\nFails import,Answer');
  const failedAttempt = `/decks/${a.deckId}/imports/${failedUpload.body.id}`;
  await write('put', `${failedAttempt}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  await source.query(
    "CREATE TRIGGER fail_state BEFORE INSERT ON flashcard_review_states FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test failure'",
  );
  try {
    expect(
      (
        await write('post', `/flashcard-decks/${a.deckId}/cards`, a.cookie, {
          front: 'Fails',
          back: 'Fails',
        })
      ).status,
    ).toBe(500);
    expect(
      (
        await write('post', `${failedAttempt}/confirm`, a.cookie, {
          confirm: true,
        })
      ).status,
    ).toBe(500);
    expect((await read(failedAttempt, a.cookie)).body.state).toBe('preview');
  } finally {
    await source.query('DROP TRIGGER fail_state');
  }
  expect(
    (await read(`/flashcard-decks/${a.deckId}/cards`, a.cookie)).body.total,
  ).toBe(2);
  expect(await state(a)).toEqual(old);
  expect(
    (
      await write('post', `${failedAttempt}/confirm`, a.cookie, {
        confirm: true,
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await read(
        `/flashcard-decks/reviews/pending?deckId=${a.deckId}`,
        a.cookie,
      )
    ).body.total,
  ).toBe(3);
});
it('schedules four exact initial UTC intervals and refuses future or invalid evaluations', async () => {
  for (const [rating, seconds] of [
    ['AGAIN', 600],
    ['HARD', 86400],
    ['GOOD', 259200],
    ['EASY', 432000],
  ] as const) {
    const a = await setup(),
      at = now.getTime();
    const result = await rate(a, rating);
    expect(result.status).toBe(200);
    expect(result.body.intervalSeconds).toBe(seconds);
    expect(new Date(result.body.dueAt).getTime()).toBe(at + seconds * 1000);
    expect(
      (
        await read(
          `/flashcard-decks/reviews/pending?deckId=${a.deckId}`,
          a.cookie,
        )
      ).body.total,
    ).toBe(0);
    expect((await rate(a, 'GOOD', 2)).status).toBe(409);
  }
  const a = await setup();
  for (const fields of [
    { rating: 'BAD' },
    { expectedRevision: 0 },
    { idempotencyKey: 'bad' },
    { userId: a.id },
    { reviewedAt: now.toISOString() },
  ])
    expect(
      (
        await write('post', `${path(a)}/reviews`, a.cookie, {
          rating: 'GOOD',
          expectedRevision: 1,
          idempotencyKey: randomUUID(),
          ...fields,
        })
      ).status,
    ).toBe(400);
  expect((await read(`${path(a)}/reviews`, a.cookie)).body.total).toBe(0);
});
it('persists one immutable event for repeated requests and rejects concurrent stale revisions or key reuse', async () => {
  const a = await setup(),
    key = randomUUID();
  const results = await Promise.all([
    rate(a, 'GOOD', 1, key),
    rate(a, 'GOOD', 1, key),
  ]);
  expect(results.map((row) => row.status)).toEqual([200, 200]);
  expect(results[0]!.body).toEqual(results[1]!.body);
  expect((await state(a)).revision).toBe(2);
  expect((await rate(a, 'EASY', 1, key)).status).toBe(409);
  expect((await rate(a, 'GOOD', 1)).status).toBe(409);
  expect((await read(`${path(a)}/reviews`, a.cookie)).body.total).toBe(1);
  const c = await setup();
  const concurrent = await Promise.all([rate(c, 'HARD'), rate(c, 'EASY')]);
  expect(concurrent.map((row) => row.status).sort()).toEqual([200, 409]);
  const d = await setup();
  expect((await rate(d, 'GOOD', 1, key)).status).toBe(200);
  const other = await write(
    'post',
    `/flashcard-decks/${a.deckId}/cards`,
    a.cookie,
    {
      front: 'Outro cartão',
      back: 'Outra resposta',
    },
  );
  expect(
    (await rate({ ...a, cardId: other.body.id }, 'GOOD', 1, key)).status,
  ).toBe(409);
});
it('advances accumulated history, resets on real content edits but not identical patches and preserves generations', async () => {
  const a = await setup(),
    first = (await rate(a)).body;
  now = new Date(first.dueAt);
  const second = (await rate(a, 'GOOD', 2)).body;
  expect(second.intervalSeconds).toBe(8 * 86400);
  const current = await state(a);
  expect(
    (await write('patch', path(a), a.cookie, { front: ' Pergunta ' })).status,
  ).toBe(200);
  expect(await state(a)).toEqual(current);
  expect(
    (await write('patch', path(a), a.cookie, { back: 'Nova resposta' })).status,
  ).toBe(200);
  const reset = await state(a);
  expect(reset).toMatchObject({
    revision: 4,
    contentGeneration: 2,
    policyState: {
      intervalSeconds: 0,
      ease: 2.5,
      successStreak: 0,
      consolidated: false,
    },
  });
  expect(
    (
      await read(
        `/flashcard-decks/reviews/pending?deckId=${a.deckId}`,
        a.cookie,
      )
    ).body.total,
  ).toBe(1);
  const history = (await read(`${path(a)}/reviews?pageSize=1`, a.cookie)).body;
  expect(history.total).toBe(2);
  expect(history.items[0].id).toBe(second.id);
  expect(history.items[0].contentGeneration).toBe(1);
  const older = (await read(`${path(a)}/reviews?pageSize=1&page=2`, a.cookie))
    .body;
  expect(older.items[0]).toEqual(first);
  const third = (await rate(a, 'AGAIN', 4)).body;
  expect(third.contentGeneration).toBe(2);
  expect(third.newState.policyState.successStreak).toBe(0);
  now = new Date(third.dueAt);
  expect((await rate(a, 'GOOD', 5)).body.intervalSeconds).toBe(259200);
  expect((await rate(a, 'GOOD', 1, first.idempotencyKey)).body).toEqual(first);
});
it('rolls back state and history together on event failure and refuses unknown policy versions', async () => {
  const a = await setup(),
    old = await state(a),
    key = randomUUID();
  await source.query(
    "CREATE TRIGGER fail_review BEFORE INSERT ON flashcard_review_events FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test failure'",
  );
  try {
    expect((await rate(a, 'GOOD', 1, key)).status).toBe(500);
    expect(await state(a)).toEqual(old);
    expect((await read(`${path(a)}/reviews`, a.cookie)).body.total).toBe(0);
  } finally {
    await source.query('DROP TRIGGER fail_review');
  }
  expect((await rate(a, 'GOOD', 1, key)).status).toBe(200);
  now = new Date((await state(a)).dueAt);
  await source.query(
    'UPDATE flashcard_review_states SET policy_version=2 WHERE card_id=?',
    [a.cardId],
  );
  expect((await rate(a, 'GOOD', 2)).body.error.code).toBe(
    'REVIEW_POLICY_INCOMPATIBLE',
  );
  expect(
    (await read(`${path(a)}/reviews`, a.cookie)).body.items[0].policyVersion,
  ).toBe(1);
});
it('requires session, origin, enabled flashcards and owner/hierarchy for state, history and rating, preserving disabled data', async () => {
  const a = await setup(),
    b = await setup();
  const paths = [
    `${path(a)}/review`,
    `${path(a)}/review-state`,
    `${path(a)}/reviews`,
    '/flashcard-decks/reviews/pending',
  ];
  for (const resource of paths)
    expect((await request(app).get(resource)).status).toBe(401);
  expect(
    (
      await request(app)
        .post(`${path(a)}/reviews`)
        .send({})
    ).status,
  ).toBe(401);
  expect(
    (
      await request(app)
        .post(`${path(a)}/reviews`)
        .set('Cookie', a.cookie)
        .send({})
    ).status,
  ).toBe(403);
  for (const suffix of ['/review', '/review-state', '/reviews']) {
    expect((await read(path(a) + suffix, b.cookie)).status).toBe(404);
    expect(
      (
        await read(
          `/flashcard-decks/${b.deckId}/cards/${a.cardId}${suffix}`,
          b.cookie,
        )
      ).status,
    ).toBe(404);
  }
  expect(
    (
      await write('post', `${path(a)}/reviews`, b.cookie, {
        rating: 'GOOD',
        expectedRevision: 1,
        idempotencyKey: randomUUID(),
      })
    ).status,
  ).toBe(404);
  const result = (await rate(a)).body;
  await new PreferencesService(source).update(a.id, { flashcards: false });
  for (const resource of paths)
    expect((await read(resource, a.cookie)).status).toBe(403);
  expect((await rate(a, 'GOOD', 2)).status).toBe(403);
  await new PreferencesService(source).update(a.id, { flashcards: true });
  expect((await read(`${path(a)}/reviews`, a.cookie)).body.items[0]).toEqual(
    result,
  );
  await write('delete', path(a), a.cookie);
  for (const table of ['flashcard_review_states', 'flashcard_review_events'])
    expect(
      await source.query(`SELECT card_id FROM ${table} WHERE card_id=?`, [
        a.cardId,
      ]),
    ).toEqual([]);
  const c = await setup();
  await rate(c);
  await write('delete', `/flashcard-decks/${c.deckId}`, c.cookie);
  for (const table of ['flashcard_review_states', 'flashcard_review_events'])
    expect(
      await source.query(`SELECT card_id FROM ${table} WHERE card_id=?`, [
        c.cardId,
      ]),
    ).toEqual([]);
});
