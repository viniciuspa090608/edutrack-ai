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
import { ImportRepository } from '../src/modules/flashcards/import.repository.js';
import { ImportService } from '../src/modules/flashcards/import.service.js';
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_imports_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });

const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
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
const upload = (
  deckId: string,
  cookie: string,
  text: string | Buffer,
  format = 'csv',
) =>
  request(app)
    .post(`/decks/${deckId}/imports?format=${format}`)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .set(
      'Content-Type',
      format === 'tsv' ? 'text/tab-separated-values' : 'text/csv',
    )
    .send(text);
async function setup() {
  const a = await account();
  const deck = (
    await write('post', '/flashcard-decks', a.cookie, { name: 'Importação' })
  ).body;
  return { ...a, deckId: deck.id as string };
}
const attemptPath = (deckId: string, id: string) =>
  `/decks/${deckId}/imports/${id}`;
const cardCount = async (deckId: string) =>
  Number(
    (
      await source.query<Array<{ total: number }>>(
        'SELECT COUNT(*) AS total FROM flashcards WHERE deck_id=?',
        [deckId],
      )
    )[0]!.total,
  );
it('applies/reverses the migration with isolated MySQL, indexes and foreign keys', async () => {
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  const indexes = await source.query<Array<{ Key_name: string }>>(
    'SHOW INDEX FROM flashcard_import_attempts',
  );
  expect(indexes.map((row) => row.Key_name)).toContain('ix_import_expiration');
  await expect(
    source.query(
      "INSERT INTO flashcard_import_attempts (id,user_id,deck_id,format,expires_at) VALUES (?,?,?,'csv',UTC_TIMESTAMP())",
      [randomUUID(), randomUUID(), randomUUID()],
    ),
  ).rejects.toThrow();
  const applied = await source.query<Array<{ name: string }>>(
    'SELECT name FROM migrations ORDER BY id DESC',
  );
  const later = applied.findIndex(
    (row) => row.name === 'CreateFlashcardImports20260926234000',
  );
  for (let index = 0; index < later; index++) await source.undoLastMigration();
  await source.undoLastMigration();
  expect(
    await source.query("SHOW TABLES LIKE 'flashcard_import_attempts'"),
  ).toEqual([]);
  expect(await source.runMigrations()).toHaveLength(1 + later);
});
it('uploads CSV/TSV without writing cards and rejects limits, encoding and malformed files', async () => {
  const a = await setup();
  for (const [format, text] of [
    ['csv', '\uFEFFx,x\r\n"a,b","say ""yes"""'],
    ['tsv', 'front\tback\n"a\tb"\t"c\nd"'],
  ]) {
    const response = await upload(a.deckId, a.cookie, text!, format!);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ state: 'uploaded', records: 1 });
    expect(response.body).not.toHaveProperty('file_bytes');
    expect(await cardCount(a.deckId)).toBe(0);
  }
  for (const text of [
    '',
    'a;b\nc;d',
    'a,b\n"bad,b',
    'a,b\n"a"x,b',
    'a,b\n' + 'x,y\n'.repeat(1001),
  ])
    expect((await upload(a.deckId, a.cookie, text)).status).toBe(400);
  expect(
    (await upload(a.deckId, a.cookie, Buffer.from([0xc3, 0x28]))).status,
  ).toBe(400);
  expect((await upload(a.deckId, a.cookie, 'a,b\nx,y', 'xlsx')).status).toBe(
    400,
  );
  expect(
    (await upload(a.deckId, a.cookie, 'a,b\n' + 'x'.repeat(2_097_153))).status,
  ).toBe(413);
  expect(
    (
      await upload(
        a.deckId,
        a.cookie,
        'a,b\n' + 'x'.repeat(2_097_152 - 6) + ',y',
      )
    ).status,
  ).toBe(201);
  expect(
    (await upload(a.deckId, a.cookie, 'a,b\n' + 'x,y\n'.repeat(1000))).status,
  ).toBe(201);
  expect(await cardCount(a.deckId)).toBe(0);
});
it('previews indexed repeated headers, swaps columns, classifies duplicates/rejections and cancels without cards', async () => {
  const a = await setup();
  await write('post', `/flashcard-decks/${a.deckId}/cards`, a.cookie, {
    front: 'old',
    back: 'answer',
  });
  const csv =
    'x,x\n old , ANSWER \nCafe\u0301,Sim\nCAFÉ,sim\n,x\nwrong\n' +
    'x'.repeat(2001) +
    ',x\n';
  const attempt = (await upload(a.deckId, a.cookie, csv)).body,
    path = attemptPath(a.deckId, attempt.id);
  expect(attempt.columns).toEqual(['x', 'x']);
  expect(
    (await write('post', `${path}/confirm`, a.cookie, { confirm: true }))
      .status,
  ).toBe(409);
  for (const input of [
    { frontColumn: 0, backColumn: 0 },
    { frontColumn: 0, backColumn: 2 },
    { frontColumn: -1, backColumn: 1 },
    { frontColumn: 0, backColumn: 1, userId: a.id },
  ])
    expect(
      (await write('put', `${path}/preview`, a.cookie, input)).status,
    ).toBe(400);
  const preview = await write('put', `${path}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  expect(preview.status).toBe(200);
  expect(preview.body.preview.counts).toEqual({
    records: 6,
    imported: 1,
    ignored: 2,
    rejected: 3,
  });
  expect(
    preview.body.preview.errors.map((row: { line: number }) => row.line),
  ).toEqual([5, 6, 7]);
  const swapped = await write('put', `${path}/preview`, a.cookie, {
    frontColumn: 1,
    backColumn: 0,
  });
  expect(swapped.body.preview.sample[0]).toMatchObject({
    front: 'ANSWER',
    back: 'old',
  });
  expect((await read(path, a.cookie)).body.preview).toEqual(
    swapped.body.preview,
  );
  expect(await cardCount(a.deckId)).toBe(1);
  expect((await write('delete', path, a.cookie)).status).toBe(204);
  expect((await read(path, a.cookie)).status).toBe(404);
  expect(await cardCount(a.deckId)).toBe(1);
  expect(
    await source.query('SELECT id FROM flashcard_import_attempts WHERE id=?', [
      attempt.id,
    ]),
  ).toEqual([]);
});
it('confirms atomically, reclassifies changed decks, returns persisted idempotent results and erases private content', async () => {
  const a = await setup();
  await new PreferencesService(source).update(a.id, { ai: false });
  const attempt = (
      await upload(
        a.deckId,
        a.cookie,
        'a,b\nnew,one\nnext,two\nNEXT,TWO\n,x\n \n,,',
      )
    ).body,
    path = attemptPath(a.deckId, attempt.id);
  const preview = await write('put', `${path}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  expect(preview.body.preview.counts).toEqual({
    records: 4,
    imported: 2,
    ignored: 1,
    rejected: 1,
  });
  await write('post', `/flashcard-decks/${a.deckId}/cards`, a.cookie, {
    front: 'NEW',
    back: ' ONE ',
  });
  expect(
    (await write('post', `${path}/confirm`, a.cookie, { confirm: false }))
      .status,
  ).toBe(400);
  const results = await Promise.all(
    Array.from({ length: 3 }, () =>
      write('post', `${path}/confirm`, a.cookie, { confirm: true }),
    ),
  );
  expect(results.map((result) => result.status)).toEqual([200, 200, 200]);
  expect(results[1]!.body).toEqual(results[0]!.body);
  expect(results[0]!.body.result.counts).toEqual({
    records: 4,
    imported: 1,
    ignored: 2,
    rejected: 1,
  });
  expect(await cardCount(a.deckId)).toBe(2);
  expect((await read(path, a.cookie)).body).toEqual(results[0]!.body);
  expect(results[0]!.body).not.toHaveProperty('columns');
  const rows = await source.query<
    Array<{ file_bytes: unknown; preview: unknown }>
  >('SELECT file_bytes,preview FROM flashcard_import_attempts WHERE id=?', [
    attempt.id,
  ]);
  expect(rows[0]).toEqual({ file_bytes: null, preview: null });
  expect((await write('delete', path, a.cookie)).status).toBe(409);
  expect(
    (
      await write('put', `${path}/preview`, a.cookie, {
        frontColumn: 1,
        backColumn: 0,
      })
    ).status,
  ).toBe(409);
});
it('rolls back every batch and attempt result after a real database write failure, then retries safely', async () => {
  const a = await setup(),
    csv =
      'a,b\n' +
      Array.from(
        { length: 50 },
        (_, index) => `front${index},back${index}\n`,
      ).join('') +
      'break,fail';
  const attempt = (await upload(a.deckId, a.cookie, csv)).body,
    path = attemptPath(a.deckId, attempt.id);
  await write('put', `${path}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  await source.query(
    "CREATE TRIGGER fail_import BEFORE INSERT ON flashcards FOR EACH ROW BEGIN IF NEW.front='break' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test failure'; END IF; END",
  );
  try {
    expect(
      (await write('post', `${path}/confirm`, a.cookie, { confirm: true }))
        .status,
    ).toBe(500);
    expect(await cardCount(a.deckId)).toBe(0);
    expect((await read(path, a.cookie)).body.state).toBe('preview');
  } finally {
    await source.query('DROP TRIGGER fail_import');
  }
  const final = await write('post', `${path}/confirm`, a.cookie, {
    confirm: true,
  });
  expect(final.body.result.counts.imported).toBe(51);
  expect(await cardCount(a.deckId)).toBe(51);
});
it('serializes two import attempts and manual mutations on the same deck', async () => {
  const a = await setup();
  const attempts = await Promise.all([
    upload(a.deckId, a.cookie, 'a,b\nsame,pair'),
    upload(a.deckId, a.cookie, 'a,b\nSAME,PAIR'),
  ]);
  const paths = attempts.map((row) => attemptPath(a.deckId, row.body.id));
  for (const path of paths)
    await write('put', `${path}/preview`, a.cookie, {
      frontColumn: 0,
      backColumn: 1,
    });
  const results = await Promise.all(
    paths.map((path) =>
      write('post', `${path}/confirm`, a.cookie, { confirm: true }),
    ),
  );
  expect(results.map((row) => row.body.result.counts.imported).sort()).toEqual([
    0, 1,
  ]);
  expect(await cardCount(a.deckId)).toBe(1);
  // Manual creation intentionally still permits identical pairs.
  expect(
    (
      await write('post', `/flashcard-decks/${a.deckId}/cards`, a.cookie, {
        front: 'same',
        back: 'pair',
      })
    ).status,
  ).toBe(201);
  expect(await cardCount(a.deckId)).toBe(2);
});
it('protects all stages by account, hierarchy, session, origin and module preference', async () => {
  const a = await setup(),
    b = await setup();
  const attempt = (await upload(a.deckId, a.cookie, 'a,b\nx,y')).body,
    path = attemptPath(a.deckId, attempt.id);
  expect((await upload(a.deckId, b.cookie, 'a,b\nx,y')).status).toBe(404);
  expect((await upload(randomUUID(), a.cookie, 'a,b\nx,y')).status).toBe(404);
  for (const resource of [path, attemptPath(b.deckId, attempt.id)]) {
    expect((await read(resource, b.cookie)).status).toBe(404);
    for (const [method, suffix, body] of [
      ['put', '/preview', { frontColumn: 0, backColumn: 1 }],
      ['post', '/confirm', { confirm: true }],
      ['delete', '', {}],
    ] as const)
      expect(
        (await write(method, resource + suffix, b.cookie, body)).status,
      ).toBe(404);
  }
  expect((await request(app).get(path)).status).toBe(401);
  for (const [method, resource, body] of [
    ['post', `/decks/${a.deckId}/imports?format=csv`, {}],
    ['put', `${path}/preview`, {}],
    ['post', `${path}/confirm`, {}],
    ['delete', path, {}],
  ] as const) {
    expect((await request(app)[method](resource).send(body)).status).toBe(401);
    expect(
      (await request(app)[method](resource).set('Cookie', a.cookie).send(body))
        .status,
    ).toBe(403);
  }
  await write('put', `${path}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  await new PreferencesService(source).update(a.id, { flashcards: false });
  expect((await upload(a.deckId, a.cookie, 'a,b\nx,y')).status).toBe(403);
  expect((await read(path, a.cookie)).status).toBe(403);
  for (const [method, suffix, body] of [
    ['put', '/preview', { frontColumn: 0, backColumn: 1 }],
    ['post', '/confirm', { confirm: true }],
    ['delete', '', {}],
  ] as const)
    expect((await write(method, path + suffix, a.cookie, body)).status).toBe(
      403,
    );
  expect(await cardCount(a.deckId)).toBe(0);
  await new PreferencesService(source).update(a.id, { flashcards: true });
  expect(
    (await write('post', `${path}/confirm`, a.cookie, { confirm: true })).body
      .result.counts.imported,
  ).toBe(1);
  await new PreferencesService(source).update(a.id, { flashcards: false });
  await new PreferencesService(source).update(a.id, { flashcards: true });
  expect((await read(path, a.cookie)).body.state).toBe('completed');
});
it('expires private bytes, periodically purges completed results, cascades deck deletion and reports zero valid cards', async () => {
  const a = await setup();
  const attempt = (await upload(a.deckId, a.cookie, 'a,b\n,x')).body,
    path = attemptPath(a.deckId, attempt.id);
  await write('put', `${path}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  const result = await write('post', `${path}/confirm`, a.cookie, {
    confirm: true,
  });
  expect(result.body.result.counts).toEqual({
    records: 1,
    imported: 0,
    ignored: 0,
    rejected: 1,
  });
  expect(await cardCount(a.deckId)).toBe(0);
  const expired = (await upload(a.deckId, a.cookie, 'a,b\nx,y')).body;
  await source.query(
    'UPDATE flashcard_import_attempts SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE id=?',
    [expired.id],
  );
  expect(
    (
      await write(
        'post',
        `${attemptPath(a.deckId, expired.id)}/confirm`,
        a.cookie,
        { confirm: true },
      )
    ).status,
  ).toBe(410);
  expect(
    await source.query('SELECT id FROM flashcard_import_attempts WHERE id=?', [
      expired.id,
    ]),
  ).toEqual([]);
  await source.query(
    'UPDATE flashcard_import_attempts SET expires_at=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 1 SECOND) WHERE id=?',
    [attempt.id],
  );
  await new ImportRepository(source).cleanupExpired();
  expect((await read(path, a.cookie)).status).toBe(404);
  const deleted = (await upload(a.deckId, a.cookie, 'a,b\nx,y')).body;
  await write('delete', `/flashcard-decks/${a.deckId}`, a.cookie);
  expect(
    (
      await write(
        'post',
        `${attemptPath(a.deckId, deleted.id)}/confirm`,
        a.cookie,
        { confirm: true },
      )
    ).status,
  ).toBe(404);
});
it('rechecks the preference under the deck lock before inserting', async () => {
  const a = await setup(),
    attempt = (await upload(a.deckId, a.cookie, 'a,b\nx,y')).body,
    path = attemptPath(a.deckId, attempt.id);
  await write('put', `${path}/preview`, a.cookie, {
    frontColumn: 0,
    backColumn: 1,
  });
  const prefs = new PreferencesService(source);
  const service = new ImportService(new ImportRepository(source), {
    requireEnabled: async (userId, capability) => {
      await prefs.update(userId, { flashcards: false });
      await prefs.requireEnabled(userId, capability);
    },
  });
  await expect(
    service.confirm(a.id, a.deckId, attempt.id, { confirm: true }),
  ).rejects.toMatchObject({ status: 403 });
  expect(await cardCount(a.deckId)).toBe(0);
  await prefs.update(a.id, { flashcards: true });
  expect((await read(path, a.cookie)).body.state).toBe('preview');
});
