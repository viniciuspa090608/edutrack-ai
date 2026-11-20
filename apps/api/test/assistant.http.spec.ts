import { AddAssistantConversationCreatedAt20261120000000 } from '../src/database/migrations/20261120000000-AddAssistantConversationCreatedAt.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import pino from 'pino';
import request from 'supertest';
import { aiModels, type AIProvider } from '@study-platform/contracts';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { AssistantHistory } from '../src/modules/ai/assistant-history.js';
import { cleanupAssistant } from '../src/database/cleanup-assistant.js';
import { createDataSource } from '../src/database/data-source.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';
import { PreferencesService } from '../src/modules/preferences/preferences.service.js';
import { AIUsageRepository } from '../src/modules/ai-settings/ai-usage.repository.js';
import { AISettingsRepository } from '../src/modules/ai-settings/ai-settings.repository.js';
import { AISettingsService } from '../src/modules/ai-settings/ai-settings.service.js';
import {
  flashcardFixture,
  providerEnvelope,
  roadmapFixture,
} from './ai-provider-fixtures.js';

const env = {
  ...loadEnv(),
  GEMINI_API_KEY: 'SYNTHETIC_ASSISTANT_KEY',
  AI_RECEIPT_KEY: 'c'.repeat(64),
  GEMINI_MODEL: 'gemini-3.8-flash',
  AI_ASSISTANT_ENABLED: 'true' as const,
  AI_ASSISTANT_MODELS: ['gemini:gemini-3.8-flash'],
  AI_ASSISTANT_USER_DAILY_LIMIT: 10,
  AI_ASSISTANT_GLOBAL_DAILY_LIMIT: 30,
  AI_ASSISTANT_GLOBAL_MAX_CONCURRENCY: 1,
  AI_USER_REQUESTS_PER_MINUTE: 100,
  AI_TIMEOUT_MS: 100,
};
const database = `${env.TEST_DB_NAME}_assistant_${randomUUID().slice(0, 8)}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = createDataSource({ ...env, DB_NAME: database });
let output: unknown;
let now = new Date();
const provider = vi.fn<typeof fetch>(async () =>
  Response.json(providerEnvelope('gemini', output)),
);
const app = createApp({
  logger: pino({ enabled: false }),
  webOrigin: env.WEB_ORIGIN,
  source,
  env,
  aiFetch: provider,
  aiClock: () => now,
});
const post = (cookie: string, path: string, body: object) =>
  request(app)
    .post(path)
    .set('Cookie', cookie)
    .set('Origin', env.WEB_ORIGIN)
    .send(body);
const read = (cookie: string, path: string) =>
  request(app).get(path).set('Cookie', cookie);
const submission = (text: string) => ({
  text,
  messageId: randomUUID(),
  attemptId: randomUUID(),
});

async function account() {
  const id = randomUUID();
  const user = await new AuthRepository(source).createGoogle(
    `${id}@example.test`,
    id,
    'Piloto',
  );
  await new PreferencesService(source).update(user.id, { ai: true });
  return {
    id: user.id,
    cookie: `edutrack_session=${await new SessionRepository(source).create(user.id)}`,
  };
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

it('reverte e reaplica a migration do assistente preservando migrations posteriores', async () => {
  const applied = await source.query<Array<{ name: string }>>(
    'SELECT name FROM migrations ORDER BY id DESC',
  );
  const assistantIndex = applied.findIndex(
    ({ name }) => name === 'CreateStudyAssistant20261115000000',
  );
  expect(assistantIndex).toBeGreaterThanOrEqual(0);
  const reverted = applied.slice(0, assistantIndex + 1).map(({ name }) => name);
  for (let index = 0; index < reverted.length; index++)
    await source.undoLastMigration();
  expect((await source.runMigrations()).map(({ name }) => name)).toEqual(
    reverted.reverse(),
  );
  expect(await source.showMigrations()).toBe(false);
});

it('pagina histórico e recupera tentativa interrompida sem aceitar resposta atrasada', async () => {
  const owner = await account();
  now = new Date();
  const input = submission('Mensagem recuperável');
  const history = new AssistantHistory(source, env.AI_TIMEOUT_MS, () => now);
  const opened = await history.begin(owner.id, input);
  const path = `/assistant/conversations/${opened.conversationId}/messages`;
  expect(
    (await read(owner.cookie, path).expect(200)).body.items[0].retryable,
  ).toBe(false);
  now = new Date(now.getTime() + env.AI_TIMEOUT_MS + 10_001);
  expect(
    (await read(owner.cookie, path).expect(200)).body.items[0].retryable,
  ).toBe(true);
  const retry = { ...input, attemptId: randomUUID() };
  await history.begin(owner.id, retry);
  await expect(
    history.finish(owner.id, input.attemptId, 'Resposta atrasada'),
  ).rejects.toMatchObject({ code: 'ASSISTANT_CONFLICT' });
  now = new Date(now.getTime() + 1);
  await history.finish(owner.id, retry.attemptId, 'Resposta retomada');
  const first = await read(owner.cookie, path + '?limit=1').expect(200);
  expect(first.body.items.map((item: { role: string }) => item.role)).toEqual([
    'assistant',
  ]);
  const second = await read(
    owner.cookie,
    path + '?' + new URLSearchParams(first.body.cursor),
  ).expect(200);
  expect(second.body.items.map((item: { role: string }) => item.role)).toEqual([
    'user',
  ]);
  expect(second.body.cursor).toBeNull();
  now = new Date(
    now.getTime() - 1 + 30 * 86_400_000 - env.AI_TIMEOUT_MS - 10_001,
  );
  expect((await read(owner.cookie, path).expect(200)).body.items).toMatchObject(
    [{ role: 'assistant' }],
  );
  now = new Date();
});

it('retoma conversa, rejeita outra conta e confirma em paralelo sem duplicar', async () => {
  const owner = await account();
  const other = await account();
  const input = submission('Crie uma tarefa chamada Revisar SQL');
  output = {
    text: 'Criei a tarefa solicitada.',
    action: { kind: 'task', task: { title: 'Revisar SQL' } },
  };
  provider.mockClear();
  await post(owner.cookie, '/assistant/messages', input).expect(200);
  await post(owner.cookie, '/assistant/messages', input).expect(200);
  const path = `/assistant/conversations/${input.messageId}/messages`;
  await read(other.cookie, path).expect(404);
  await post(other.cookie, '/assistant/messages', {
    ...submission('Olá'),
    conversationId: input.messageId,
  }).expect(404);
  const resumed = await read(owner.cookie, path).expect(200);
  expect(
    resumed.body.items.find(
      (item: { role: string }) => item.role === 'assistant',
    ).text,
  ).toBe('Revise a prévia e confirme para salvar.');
  expect(
    await source.query('SELECT id FROM study_tasks WHERE user_id = ?', [
      owner.id,
    ]),
  ).toHaveLength(0);
  const preview = resumed.body.items.find(
    (item: { preview: unknown }) => item.preview,
  ).preview;
  const confirm = { previewId: preview.id, idempotencyKey: preview.key };
  await post(other.cookie, '/assistant/confirmations', confirm).expect(404);
  await post(owner.cookie, '/assistant/confirmations', {
    ...confirm,
    action: {},
  }).expect(400);
  const results = await Promise.all([
    post(owner.cookie, '/assistant/confirmations', confirm).expect(200),
    post(owner.cookie, '/assistant/confirmations', confirm).expect(200),
  ]);
  expect(results[0].body).toEqual(results[1].body);
  await new SessionRepository(source).revoke(owner.cookie.split('=')[1]!);
  await post(owner.cookie, '/assistant/confirmations', confirm).expect(401);
  owner.cookie = `edutrack_session=${await new SessionRepository(source).create(owner.id)}`;
  expect(provider).toHaveBeenCalledTimes(1);
  now = new Date();
  await source.query(
    'UPDATE assistant_messages SET expires_at = ? WHERE user_id = ?',
    [now, owner.id],
  );
  await read(owner.cookie, path).expect(404);
  await source.query(
    'UPDATE assistant_previews SET expires_at = ? WHERE user_id = ?',
    [now, owner.id],
  );
  await post(owner.cookie, '/assistant/confirmations', confirm).expect(404);
  expect(await cleanupAssistant(source)).toMatchObject({ messages: 2 });
  expect(await cleanupAssistant(source)).toMatchObject({
    messages: 0,
    conversations: 0,
  });
  const tasks = await source.query(
    'SELECT id FROM study_tasks WHERE user_id = ?',
    [owner.id],
  );
  expect(tasks).toHaveLength(1);
});

it('preserva o envio após timeout e reserva capacidade para os outros fluxos', async () => {
  const owner = await account();
  const other = await account();
  const input = submission('Olá');
  now = new Date();
  provider.mockImplementationOnce(() => new Promise(() => {}));
  await post(owner.cookie, '/assistant/messages', input).expect(504);
  const path = `/assistant/conversations/${input.messageId}/messages`;
  expect((await read(owner.cookie, path).expect(200)).body.items).toMatchObject(
    [{ retryable: true, text: 'Olá' }],
  );
  const usage = new AIUsageRepository(source, env);
  const release = await usage.reserve(owner.id, true, true);
  try {
    await post(other.cookie, '/assistant/messages', submission('Olá')).expect(
      429,
    );
    await (
      await usage.reserve(other.id, true)
    )();
  } finally {
    await release();
  }
  output = { text: 'Olá!', action: null };
  await post(owner.cookie, '/assistant/messages', {
    ...input,
    attemptId: randomUUID(),
  }).expect(200);
  expect((await read(owner.cookie, path).expect(200)).body.items).toHaveLength(
    2,
  );
  const unavailable = submission('Mais uma pergunta');
  provider.mockResolvedValueOnce(new Response(null, { status: 503 }));
  await post(owner.cookie, '/assistant/messages', unavailable).expect(503);
  const retained = await read(
    owner.cookie,
    `/assistant/conversations/${unavailable.messageId}/messages`,
  ).expect(200);
  expect(retained.body.items).toMatchObject([
    { text: unavailable.text, retryable: true },
  ]);
});

it('limpa em lotes preservando um envio concorrente na mesma conversa', async () => {
  const owner = await account();
  const expired = new Date(Date.now() - 60_000);
  const fixed = new Date();
  const history = new AssistantHistory(source, env.AI_TIMEOUT_MS, () => fixed);
  const { conversationId } = await history.begin(
    owner.id,
    submission('Mensagem vigente'),
  );
  const insert =
    'INSERT INTO assistant_messages (user_id,id,conversation_id,role,body,created_at,expires_at) VALUES ';
  const fixtures = Array.from({ length: 501 }, () => [
    owner.id,
    randomUUID(),
    conversationId,
    'user',
    'Sintético',
    new Date(expired.getTime() - 30 * 86_400_000),
    expired,
  ]);
  await source.query(
    insert + fixtures.map(() => '(?,?,?,?,?,?,?)').join(','),
    fixtures.flat(),
  );
  const [cleanup, sent] = await Promise.all([
    cleanupAssistant(source),
    history.begin(owner.id, {
      ...submission('Envio concorrente'),
      conversationId,
    }),
  ]);
  expect(cleanup.messages).toBe(501);
  expect(sent.started).toBe(true);
  const retained = await history.messages(owner.id, conversationId, {
    limit: 20,
  });
  expect(retained.map(({ body }) => body).sort()).toEqual([
    'Envio concorrente',
    'Mensagem vigente',
  ]);
});

it('confirma matérias e flashcards em lote e revalida preferências antes da escrita', async () => {
  const owner = await account();
  async function propose(text: string, action: unknown) {
    output = { text: 'Revise sua criação.', action };
    const input = submission(text);
    await post(owner.cookie, '/assistant/messages', input).expect(200);
    const resumed = await read(
      owner.cookie,
      `/assistant/conversations/${input.messageId}/messages`,
    ).expect(200);
    const preview = resumed.body.items.find(
      (item: { preview: unknown }) => item.preview,
    ).preview;
    return { previewId: preview.id, idempotencyKey: preview.key };
  }
  const matter = await propose('Crie uma matéria chamada SQL', {
    kind: 'subject',
    subject: {
      name: 'SQL',
      currentLevel: 'BEGINNER',
      dueDate: '2026-12-30',
    },
  });
  await post(owner.cookie, '/assistant/confirmations', matter).expect(200);
  expect(
    (await read(owner.cookie, '/subjects').expect(200)).body.items[0],
  ).toMatchObject({
    name: 'SQL',
    objective: 'Estudar e me aprimorar em SQL',
    weeklyHours: 1,
    knownTopics: [],
  });
  const deck = await post(owner.cookie, '/flashcard-decks', {
    name: 'Banco de Dados',
  }).expect(201);
  const cards = await propose('Crie flashcards no baralho Banco de Dados', {
    kind: 'flashcards',
    deckId: deck.body.id,
    cards: [
      { front: 'O que é SQL?', back: 'Uma linguagem.' },
      { front: 'Qual comando lê dados?', back: 'SELECT.' },
    ],
  });
  const prefs = new PreferencesService(source);
  await prefs.update(owner.id, { flashcards: false });
  await post(owner.cookie, '/assistant/confirmations', cards).expect(403);
  await prefs.update(owner.id, { flashcards: true });
  await source.query(`CREATE TRIGGER assistant_reject_review BEFORE INSERT ON flashcard_review_states
    FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'synthetic failure'`);
  try {
    await post(owner.cookie, '/assistant/confirmations', cards).expect(500);
    expect(
      await source.query('SELECT id FROM flashcards WHERE deck_id = ?', [
        deck.body.id,
      ]),
    ).toEqual([]);
  } finally {
    await source.query('DROP TRIGGER assistant_reject_review');
  }
  const result = await post(
    owner.cookie,
    '/assistant/confirmations',
    cards,
  ).expect(200);
  expect(result.body.ids).toHaveLength(2);
});

it('valida os protocolos do catálogo e rejeita configuração fora da matriz antes da chamada', async () => {
  const owner = await account();
  const combinations = Object.entries(aiModels).map(
    ([provider, models]) => [provider as AIProvider, models[0]] as const,
  );
  const settings = new AISettingsService(new AISettingsRepository(source), env);
  let revision = 0;
  for (const [providerName, model] of combinations) {
    const configured = await settings.update(owner.id, {
      mode: 'personal',
      provider: providerName,
      model,
      revision,
      apiKey: 'SYNTHETIC_ASSISTANT_PERSONAL_KEY',
    });
    revision = configured.revision;
    const candidate = createApp({
      logger: pino({ enabled: false }),
      webOrigin: env.WEB_ORIGIN,
      source,
      env: { ...env, AI_ASSISTANT_MODELS: [`${providerName}:${model}`] },
      aiFetch: async () =>
        Response.json(
          providerEnvelope(providerName, {
            text: 'Resposta sintética.',
            action: null,
          }),
        ),
    });
    await request(candidate)
      .post('/assistant/messages')
      .set('Cookie', owner.cookie)
      .set('Origin', env.WEB_ORIGIN)
      .send(submission('Olá'))
      .expect(200);
  }
  provider.mockClear();
  await post(owner.cookie, '/assistant/messages', submission('Olá')).expect(
    422,
  );
  expect(provider).not.toHaveBeenCalled();
});

it('projeta apenas tarefas da semana da conta e pede destino sem enviar nomes ambíguos', async () => {
  const owner = await account();
  const other = await account();
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'UTC',
  }).format(new Date());
  for (const [cookie, title, dueDate] of [
    [owner.cookie, 'PRÓPRIA_SEMANA', today],
    [owner.cookie, 'FORA_DA_SEMANA', '2100-01-01'],
    [other.cookie, 'OUTRA_CONTA_CANARY', today],
  ] as const)
    await post(cookie, '/tasks', { title, dueDate }).expect(201);
  output = { text: 'Consulta sintética.', action: null };
  provider.mockClear();
  await post(
    owner.cookie,
    '/assistant/messages',
    submission('Quais tarefas vencem nesta semana?'),
  ).expect(200);
  const payload = String(provider.mock.calls[0]?.[1]?.body);
  expect(payload).toContain('PRÓPRIA_SEMANA');
  expect(payload).not.toMatch(
    /FORA_DA_SEMANA|OUTRA_CONTA_CANARY|SYNTHETIC_ASSISTANT_KEY/,
  );
  const deck = await post(owner.cookie, '/flashcard-decks', {
    name: 'Dados',
  }).expect(201);
  await post(
    other.cookie,
    '/assistant/messages',
    submission(`Crie flashcards no baralho ${deck.body.id}`),
  ).expect(200);
  expect(provider).toHaveBeenCalledTimes(1);
  await post(owner.cookie, '/flashcard-decks', { name: 'Dados' }).expect(201);
  const ambiguous = submission('Crie flashcards no baralho Dados');
  await post(owner.cookie, '/assistant/messages', ambiguous).expect(200);
  const result = await read(
    owner.cookie,
    `/assistant/conversations/${ambiguous.messageId}/messages`,
  ).expect(200);
  expect(result.body.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        role: 'assistant',
        text: expect.stringContaining('qual baralho'),
        preview: null,
      }),
    ]),
  );
  expect(provider).toHaveBeenCalledTimes(1);
});

it('mede carga mista e mantém slots para roadmaps e flashcards com chat ocupado', async () => {
  const [chat, blocked, roadmap, flashcards] = await Promise.all([
    account(),
    account(),
    account(),
    account(),
  ]);
  const plan = {
    currentLevel: 'BEGINNER',
    objective: 'Aprender',
    dueDate: '2027-01-01',
    weeklyHours: 2,
    knownTopics: [],
  };
  const subject = await post(roadmap.cookie, '/subjects', {
    ...plan,
    name: 'SQL',
  }).expect(201);
  const deck = await post(flashcards.cookie, '/flashcard-decks', {
    name: 'Dados',
  }).expect(201);
  let announceStart!: () => void;
  const started = new Promise<void>((resolve) => {
    announceStart = resolve;
  });
  let releaseChat!: () => void;
  const waitForOthers = new Promise<void>((resolve) => {
    releaseChat = resolve;
  });
  let active = 0;
  let peak = 0;
  let calls = 0;
  const mixed = createApp({
    logger: pino({ enabled: false }),
    webOrigin: env.WEB_ORIGIN,
    source,
    env: { ...env, AI_TIMEOUT_MS: 3000, AI_DEFAULT_GLOBAL_MAX_CONCURRENCY: 3 },
    aiFetch: async (_url, options) => {
      calls += 1;
      active += 1;
      peak = Math.max(peak, active);
      const body = String(options?.body);
      const assistant = Boolean(
        JSON.parse(body).generationConfig.responseJsonSchema.properties.action,
      );
      try {
        if (assistant) {
          announceStart();
          await waitForOthers;
        } else await new Promise((resolve) => setTimeout(resolve, 40));
        return Response.json(
          providerEnvelope(
            'gemini',
            assistant
              ? { text: 'Consulta sintética.', action: null }
              : body.includes('Crie um roadmap de estudo')
                ? roadmapFixture
                : flashcardFixture,
          ),
        );
      } finally {
        active -= 1;
      }
    },
  });
  const send = (cookie: string, path: string, body: object) =>
    request(mixed)
      .post(path)
      .set('Cookie', cookie)
      .set('Origin', env.WEB_ORIGIN)
      .send(body);
  const began = performance.now();
  const chatRequest = send(
    chat.cookie,
    '/assistant/messages',
    submission('Olá'),
  )
    .expect(200)
    .then((value) => value);
  await started;
  try {
    await Promise.all([
      send(blocked.cookie, '/assistant/messages', submission('Olá')).expect(
        429,
      ),
      send(
        roadmap.cookie,
        `/subjects/${subject.body.id}/roadmap-generations`,
        plan,
      ).expect(200),
      send(
        flashcards.cookie,
        `/flashcard-decks/${deck.body.id}/ai-generations`,
        { text: 'SQL sintético' },
      ).expect(200),
    ]);
  } finally {
    releaseChat();
    await chatRequest;
  }
  expect(calls).toBe(3);
  expect(peak).toBe(3);
  process.stdout.write(
    JSON.stringify({
      event: 'assistant_mixed_test',
      requests: 4,
      providerCalls: calls,
      peak,
      reservedNonChatSlots: 2,
      durationMs: Math.round(performance.now() - began),
    }) + '\n',
  );
});
it.each([1, 2])(
  'contabiliza cada repetição no MySQL e bloqueia antes do provedor ao esgotar %i chamada(s)',
  async (dailyLimit) => {
    const owner = await account();
    const boundary = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        Response.json(
          providerEnvelope('gemini', {
            text: 'Revise a tarefa.',
            action: { kind: 'task', task: { title: 'Revisar SQL' } },
          }),
        ),
      );
    const retryEnv = {
      ...env,
      AI_TIMEOUT_MS: 3000,
      AI_ASSISTANT_RETRY_DELAY_MS: 100,
      AI_ASSISTANT_USER_DAILY_LIMIT: dailyLimit,
    };
    const retryApp = createApp({
      source,
      env: retryEnv,
      webOrigin: env.WEB_ORIGIN,
      logger: pino({ enabled: false }),
      aiFetch: boundary,
      aiClock: () => now,
    });
    const response = await request(retryApp)
      .post('/assistant/messages')
      .set('Cookie', owner.cookie)
      .set('Origin', env.WEB_ORIGIN)
      .send(submission('Crie uma tarefa chamada Revisar SQL'));
    expect(response.status).toBe(dailyLimit === 1 ? 429 : 200);
    expect(boundary).toHaveBeenCalledTimes(dailyLimit);
    const counters = await source.query<Array<{ calls: number }>>(
      'SELECT calls FROM ai_usage_counters WHERE scope = ? AND window_key = ?',
      ['chat:user:' + owner.id, 'day:' + now.toISOString().slice(0, 10)],
    );
    expect(counters[0]?.calls).toBe(dailyLimit);
    const leases = await source.query(
      'SELECT id FROM ai_usage_leases WHERE user_id = ?',
      [owner.id],
    );
    expect(leases).toHaveLength(0);
  },
);

it('deriva títulos de mensagens vigentes isoladas e preserva paginação e data de criação', async () => {
  const owner = await account(),
    other = await account();
  const fixed = new Date();
  now = fixed;
  const history = new AssistantHistory(source, env.AI_TIMEOUT_MS, () => fixed);
  const first = await history.begin(owner.id, submission('Primeiro assunto'));
  const second = await history.begin(owner.id, submission('Outro assunto'));
  await history.begin(other.id, submission('Título privado'));
  let rows = await history.conversations(owner.id, { limit: 1 });
  expect(rows).toHaveLength(2);
  expect(rows.map((row) => row.title)).not.toContain('Título privado');
  const last = rows[0]!;
  const next = await history.conversations(owner.id, {
    limit: 1,
    cursor: { at: last.updated_at.toISOString(), id: last.id },
  });
  expect(next.map((row) => row.id)).toEqual([rows[1]!.id]);
  await source.query(
    'UPDATE assistant_messages SET created_at=? WHERE user_id=? AND conversation_id=?',
    [new Date(fixed.getTime() - 10000), owner.id, first.conversationId],
  );
  await history.begin(owner.id, {
    ...submission('Próximo assunto'),
    conversationId: first.conversationId,
  });
  rows = await history.conversations(owner.id, { limit: 20 });
  expect(rows.find((row) => row.id === first.conversationId)?.title).toBe(
    'Primeiro assunto',
  );
  await source.query(
    'UPDATE assistant_messages SET expires_at=? WHERE user_id=? AND conversation_id=? AND body=?',
    [
      new Date(fixed.getTime() - 1),
      owner.id,
      first.conversationId,
      'Primeiro assunto',
    ],
  );
  expect(
    (await history.conversations(owner.id, { limit: 20 })).find(
      (row) => row.id === first.conversationId,
    )?.title,
  ).toBe('Próximo assunto');
  await source.query(
    "UPDATE assistant_messages SET role='assistant' WHERE user_id=? AND conversation_id=?",
    [owner.id, second.conversationId],
  );
  expect(
    (await history.conversations(owner.id, { limit: 20 })).find(
      (row) => row.id === second.conversationId,
    )?.title,
  ).toBe('Nova conversa');
  const response = await read(owner.cookie, '/assistant/conversations');
  expect(response.status).toBe(200);
  expect(response.body.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        title: 'Próximo assunto',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    ]),
  );
});

it('preenche data legada e reverte somente a coluna adicional', async () => {
  const owner = await account();
  const history = new AssistantHistory(source, env.AI_TIMEOUT_MS);
  const opened = await history.begin(owner.id, submission('Conversa legada'));
  const migration = new AddAssistantConversationCreatedAt20261120000000();
  const runner = source.createQueryRunner();
  try {
    await migration.down(runner);
    await migration.up(runner);
    const [row] = await source.query<Array<{ created_at: Date }>>(
      'SELECT created_at FROM assistant_conversations WHERE user_id=? AND id=?',
      [owner.id, opened.conversationId],
    );
    const [message] = await history.messages(owner.id, opened.conversationId, {
      limit: 20,
    });
    expect(row!.created_at.toISOString()).toBe(
      message!.created_at.toISOString(),
    );
    expect(message!.body).toBe('Conversa legada');
  } finally {
    await runner.release();
  }
});
