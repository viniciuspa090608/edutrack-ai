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
const env = loadEnv();
const database = `${env.TEST_DB_NAME}_flashcards_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });

const app = createApp({
  logger: pino({ level: 'silent' }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
});
const input = {
  name: ' Álgebra ',
  currentLevel: 'BEGINNER',
  objective: 'Aprender',
  dueDate: '2024-02-29',
  weeklyHours: 1.5,
  knownTopics: [],
};
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

it('applies and rolls back the migration on isolated real MySQL', async () => {
  expect(source.options.synchronize).toBe(false);
  expect(await source.runMigrations()).toEqual([]);
  for (const [table, index] of [
    ['flashcard_decks', 'ix_decks_owner_created'],
    ['flashcards', 'ix_cards_deck_created'],
  ]) {
    const rows = await source.query<Array<{ Key_name: string }>>(
      `SHOW INDEX FROM ${table}`,
    );
    expect(rows.map((row) => row.Key_name)).toContain(index);
  }
  await expect(
    source.query(
      'INSERT INTO flashcards (id,deck_id,front,back) VALUES (?,?,?,?)',
      [randomUUID(), randomUUID(), 'a', 'b'],
    ),
  ).rejects.toThrow();
  await source.undoLastMigration();
  expect(await source.query("SHOW TABLES LIKE 'flashcard_decks'")).toEqual([]);
  expect(await source.query("SHOW TABLES LIKE 'flashcards'")).toEqual([]);
  expect(await source.runMigrations()).toHaveLength(1);
});
it('authenticates every endpoint, requires origin and rejects invalid external input', async () => {
  const a = await account();
  const root = '/flashcard-decks';
  const deck = `${root}/${randomUUID()}`,
    cards = `${deck}/cards`,
    card = `${cards}/${randomUUID()}`;
  for (const path of [root, deck, cards, card])
    expect((await request(app).get(path)).status).toBe(401);
  for (const [method, path] of [
    ['post', root],
    ['patch', deck],
    ['delete', deck],
    ['post', cards],
    ['patch', card],
    ['delete', card],
  ] as const) {
    expect((await request(app)[method](path).send({})).status).toBe(401);
    expect(
      (await request(app)[method](path).set('Cookie', a.cookie).send({}))
        .status,
    ).toBe(403);
  }
  for (const fields of [
    { name: ' ' },
    { subjectId: 'bad' },
    { userId: a.id },
    { description: 'a'.repeat(1001) },
  ])
    expect(
      (await write('post', root, a.cookie, { name: 'x', ...fields })).status,
    ).toBe(400);
  expect((await read(root, a.cookie)).body.total).toBe(0);
  expect((await read(`${root}/bad`, a.cookie)).status).toBe(404);
  expect((await read(`${root}?pageSize=101`, a.cookie)).status).toBe(400);
});
it('isolates two accounts and the deck/card hierarchy for all reads and mutations', async () => {
  const a = await account(),
    b = await account();
  const root = '/flashcard-decks';
  const d = (await write('post', root, a.cookie, { name: ' Álgebra ' })).body;
  expect(d).toMatchObject({
    name: 'Álgebra',
    subjectId: null,
    description: null,
  });
  const path = `${root}/${d.id}`;
  expect((await read(`${path}/cards`, a.cookie)).body.items).toEqual([]);
  const c = (
    await write('post', `${path}/cards`, a.cookie, {
      front: ' pergunta\ncom linha ',
      back: 'resposta',
    })
  ).body;
  const cp = `${path}/cards/${c.id}`;
  for (const resource of [path, cp]) {
    expect((await read(resource, b.cookie)).status).toBe(404);
    expect(
      (
        await write(
          'patch',
          resource,
          b.cookie,
          resource === path ? { name: 'alterado' } : { back: 'alterado' },
        )
      ).status,
    ).toBe(404);
    expect((await write('delete', resource, b.cookie)).status).toBe(404);
    expect(
      (
        await read(
          resource.replace(resource === path ? d.id : c.id, randomUUID()),
          b.cookie,
        )
      ).body.error.code,
    ).toBe('FLASHCARD_NOT_FOUND');
  }
  expect((await read(`${path}/cards`, b.cookie)).status).toBe(404);
  expect(
    (await write('post', `${path}/cards`, b.cookie, { front: 'a', back: 'b' }))
      .status,
  ).toBe(404);
  const other = (await write('post', root, a.cookie, { name: 'Outro' })).body;
  for (const method of ['get', 'patch', 'delete'] as const) {
    const wrong = `${root}/${other.id}/cards/${c.id}`;
    const response =
      method === 'get'
        ? await read(wrong, a.cookie)
        : await write(method, wrong, a.cookie, { back: 'novo' });
    expect(response.status).toBe(404);
  }
  for (const body of [
    { front: ' ', back: 'a' },
    { front: 'a', back: '' },
    { front: 'a', back: 'b', userId: a.id },
  ])
    expect((await write('post', `${path}/cards`, a.cookie, body)).status).toBe(
      400,
    );
  expect((await write('patch', cp, a.cookie, {})).status).toBe(400);
  expect((await write('patch', path, a.cookie, {})).status).toBe(400);
  const updated = await write('patch', cp, a.cookie, { back: 'nova resposta' });
  expect(updated.body).toMatchObject({
    front: 'pergunta\ncom linha',
    back: 'nova resposta',
  });
  const listed = (await read(`${path}/cards`, a.cookie)).body;
  expect(listed.items[0]).not.toHaveProperty('back');
  expect((await read(cp, a.cookie)).body.back).toBe('nova resposta');
  const second = (
    await write('post', `${path}/cards`, a.cookie, {
      front: 'segunda',
      back: 'verso',
    })
  ).body;
  expect((await write('delete', cp, a.cookie)).status).toBe(204);
  expect((await read(`${path}/cards/${second.id}`, a.cookie)).status).toBe(200);
  expect(
    (await write('patch', path, a.cookie, { description: 'nova' })).body.name,
  ).toBe('Álgebra');
  const firstPage = (await read(`${root}?page=1&pageSize=1`, a.cookie)).body;
  const secondPage = (await read(`${root}?page=2&pageSize=1`, a.cookie)).body;
  expect(firstPage.totalPages).toBe(2);
  expect(firstPage.items[0].id).not.toBe(secondPage.items[0].id);
  expect(
    (await read(`${root}?page=1&pageSize=1`, a.cookie)).body.items,
  ).toEqual(firstPage.items);
  expect((await read(root, b.cookie)).body.total).toBe(0);
  const cardPage = (await read(`${path}/cards?pageSize=1`, a.cookie)).body;
  expect(cardPage.total).toBe(1);
  expect((await write('delete', path, a.cookie)).status).toBe(204);
  expect(
    await source.query('SELECT id FROM flashcards WHERE deck_id=?', [d.id]),
  ).toEqual([]);
});
it('validates optional subjects through their public service and preserves data across preferences', async () => {
  const a = await account(),
    b = await account();
  const prefs = new PreferencesService(source);
  await prefs.update(a.id, { subjects: true, flashcards: true, ai: false });
  await prefs.update(b.id, { subjects: true });
  const subject = (await write('post', '/subjects', a.cookie, input)).body;
  const foreign = (await write('post', '/subjects', b.cookie, input)).body;
  const root = '/flashcard-decks';
  for (const subjectId of [foreign.id, randomUUID()])
    expect(
      (await write('post', root, a.cookie, { name: 'x', subjectId })).status,
    ).toBe(404);
  const deck = (
    await write('post', root, a.cookie, {
      name: 'Relacionado',
      subjectId: subject.id,
    })
  ).body;
  const path = `${root}/${deck.id}`;
  const card = (
    await write('post', `${path}/cards`, a.cookie, { front: 'a', back: 'b' })
  ).body;
  for (const subjectId of [foreign.id, randomUUID()])
    expect(
      (await write('patch', path, a.cookie, { name: 'errado', subjectId }))
        .status,
    ).toBe(404);
  expect((await read(path, a.cookie)).body).toMatchObject({
    name: 'Relacionado',
    subjectId: subject.id,
  });
  await prefs.update(a.id, { subjects: false });
  expect(
    (await write('patch', path, a.cookie, { subjectId: subject.id })).status,
  ).toBe(403);
  expect(
    (await write('post', root, a.cookie, { name: 'x', subjectId: subject.id }))
      .status,
  ).toBe(403);
  expect(
    (await write('patch', path, a.cookie, { name: 'Permitido' })).body
      .subjectId,
  ).toBe(subject.id);
  expect((await read(path, a.cookie)).body).not.toHaveProperty('subjectName');
  expect(
    (await write('patch', path, a.cookie, { subjectId: null })).body.subjectId,
  ).toBeNull();
  expect(
    (await write('post', root, a.cookie, { name: 'Sem matéria' })).status,
  ).toBe(201);
  await prefs.update(a.id, { subjects: true });
  expect(
    (await write('patch', path, a.cookie, { subjectId: subject.id })).status,
  ).toBe(200);
  expect(
    (await write('delete', `/subjects/${subject.id}`, a.cookie)).status,
  ).toBe(204);
  expect((await read(path, a.cookie)).body.subjectId).toBeNull();
  expect((await read(`${path}/cards/${card.id}`, a.cookie)).body.back).toBe(
    'b',
  );
  await prefs.update(a.id, { flashcards: false });
  for (const resource of [
    root,
    path,
    `${path}/cards`,
    `${path}/cards/${card.id}`,
  ])
    expect((await read(resource, a.cookie)).status).toBe(403);
  for (const [method, resource, body] of [
    ['post', root, { name: 'x' }],
    ['patch', path, { name: 'x' }],
    ['delete', path, {}],
    ['post', `${path}/cards`, { front: 'x', back: 'y' }],
    ['patch', `${path}/cards/${card.id}`, { back: 'x' }],
    ['delete', `${path}/cards/${card.id}`, {}],
  ] as const)
    expect((await write(method, resource, a.cookie, body)).status).toBe(403);
  await prefs.update(a.id, { flashcards: true });
  expect((await read(`${path}/cards/${card.id}`, a.cookie)).body.back).toBe(
    'b',
  );
});
