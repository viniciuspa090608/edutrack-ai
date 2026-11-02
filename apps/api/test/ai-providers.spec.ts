import { expect, it, vi } from 'vitest';
import {
  aiModels,
  roadmapContentSchema,
  suffixSchema,
  flashcardAIOutputSchema,
} from '@study-platform/contracts';
import type { AIProvider } from '@study-platform/contracts';
import {
  StructuredProvider,
  RoutedStructuredProvider,
  claudeSchema,
} from '../src/shared/structured-provider.js';
import { loadEnv } from '../src/config/env.js';
import {
  providerEnvelope,
  roadmapFixture,
  suffixFixture,
  flashcardFixture,
} from './ai-provider-fixtures.js';
const env = { ...loadEnv(), AI_TIMEOUT_MS: 100, AI_MAX_RESPONSE_BYTES: 4096 };
const canary = 'SYNTHETIC_AI_SECRET_CANARY_67890';
const providers = Object.keys(aiModels) as AIProvider[];
const flows = [
  [roadmapContentSchema, roadmapFixture],
  [suffixSchema, suffixFixture],
  [flashcardAIOutputSchema, flashcardFixture],
] as const;
const destinations = {
  gemini: 'generativelanguage.googleapis.com',
  claude: 'api.anthropic.com',
  openai: 'api.openai.com',
  deepseek: 'api.deepseek.com',
  kimi: 'api.moonshot.ai',
};

it.each(providers)(
  'validates all catalog models for %s across the three schemas, keeping secrets only in the correct authentication header',
  async (provider) => {
    for (const model of aiModels[provider])
      for (const [schema, content] of flows) {
        const boundary = vi.fn<typeof fetch>(async () =>
          Response.json(providerEnvelope(provider, content)),
        );
        const result = await new StructuredProvider(env, boundary).structured(
          { provider, model, credential: canary, shared: false },
          { topic: 'Dados de estudo' },
          schema,
          'study',
          'Gerar',
        );
        expect(result).toEqual(content);
        const [url, options] = boundary.mock.calls[0]!;
        expect(new URL(String(url)).hostname).toBe(destinations[provider]);
        expect(String(url)).not.toContain(canary);
        expect(String(options!.body)).not.toContain(canary);
        expect(options!.redirect).toBe('error');
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
        expect(boundary).toHaveBeenCalledTimes(1);
      }
  },
);
it.each(providers)(
  'sanitizes reflected output, errors, refusals, empty, malformed, oversized and timed out %s responses without retry',
  async (provider) => {
    const snapshot = {
      provider,
      model: aiModels[provider][0],
      credential: canary,
      shared: false,
    };
    for (const response of [
      Response.json(
        providerEnvelope(provider, {
          cards: [{ front: canary, back: 'Refletida' }],
        }),
      ),
      new Response(canary, { status: 401 }),
      new Response(canary, { status: 429 }),
      new Response(canary, { status: 500 }),
      Response.json({ refusal: canary }),
      Response.json(providerEnvelope(provider, {})),
      new Response('not json'),
      Response.json(providerEnvelope(provider, 'not-json')),
      new Response('x'.repeat(4097)),
      new Response('x', { headers: { 'content-length': '4097' } }),
    ]) {
      const boundary = vi.fn<typeof fetch>(async () => response);
      try {
        await new StructuredProvider(env, boundary).structured(
          snapshot,
          {},
          flashcardAIOutputSchema,
          'cards',
          'Gerar',
        );
        expect.fail('must reject');
      } catch (error) {
        expect(error).toHaveProperty('code', expect.stringMatching(/^AI_/));
        expect(String(error)).not.toContain(canary);
      }
      expect(boundary).toHaveBeenCalledTimes(1);
    }
    for (const boundary of [
      async () => {
        throw new Error(canary);
      },
      async () => new Promise<Response>(() => {}),
      async () => new Response(new ReadableStream()),
    ]) {
      await expect(
        new StructuredProvider(env, boundary).structured(
          snapshot,
          {},
          flashcardAIOutputSchema,
          'cards',
          'Gerar',
        ),
      ).rejects.toHaveProperty('code', expect.stringMatching(/^AI_/));
    }
    const boundary = vi.fn<typeof fetch>();
    await expect(
      new StructuredProvider(env, boundary).structured(
        { ...snapshot, model: 'https://attacker.test' },
        {},
        flashcardAIOutputSchema,
        'cards',
        'Gerar',
      ),
    ).rejects.toHaveProperty('code', 'AI_UNAVAILABLE');
    await expect(
      new StructuredProvider(env, boundary).structured(
        snapshot,
        { topic: canary },
        flashcardAIOutputSchema,
        'cards',
        'Gerar',
      ),
    ).rejects.toHaveProperty('code', 'AI_INVALID_RESPONSE');
    expect(boundary).not.toHaveBeenCalled();
  },
);
it('translates Claude grammar constraints while retaining local validation', () => {
  expect(
    claudeSchema({
      type: 'array',
      minItems: 2,
      maxItems: 20,
      items: { type: 'string', minLength: 2, maxLength: 10 },
    }),
  ).toEqual({
    type: 'array',
    description: ' Restrições: minItems: 2, maxItems: 20',
    items: {
      type: 'string',
      description: ' Restrições: minLength: 2, maxLength: 10',
    },
  });
});
it('captures one snapshot and releases a lease on external failure, with no fallback', async () => {
  let current: AIProvider = 'openai';
  const release = vi.fn(async () => {});
  const resolve = vi.fn(async () => ({
    provider: current,
    model: aiModels[current][0],
    credential: canary,
    shared: false,
  }));
  const boundary = vi.fn<typeof fetch>(async (url) => {
    current = 'gemini';
    expect(String(url)).toContain('api.openai.com');
    return new Response(canary, { status: 403 });
  });
  const reserve = vi.fn(async () => release);
  const routed = new RoutedStructuredProvider(
    { resolve },
    { reserve },
    new StructuredProvider(env, boundary),
  );
  await expect(
    routed.structured('account', {}, flashcardAIOutputSchema, 'cards', 'Gerar'),
  ).rejects.toHaveProperty('code', 'AI_CREDENTIAL_REJECTED');
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(boundary).toHaveBeenCalledTimes(1);
  expect(release).toHaveBeenCalledTimes(1);
});

it('rejects decoded reflection even with JSON-escaped credentials and before spending quota on local invalid input', async () => {
  const secret = 'SYNTHETIC_"QUOTED_\\CREDENTIAL';
  const snapshot = {
    provider: 'openai' as const,
    model: aiModels.openai[0],
    credential: secret,
    shared: false,
  };
  const boundary = vi.fn<typeof fetch>(async () =>
    Response.json(
      providerEnvelope('openai', {
        cards: [{ front: secret, back: 'Estudo' }],
      }),
    ),
  );
  const reserve = vi.fn(async () => async () => {});
  const routed = new RoutedStructuredProvider(
    { resolve: async () => snapshot },
    { reserve },
    new StructuredProvider(env, boundary),
  );
  await expect(
    routed.structured(
      'account',
      { topic: secret },
      flashcardAIOutputSchema,
      'cards',
      'Gerar',
    ),
  ).rejects.toHaveProperty('code', 'AI_INVALID_RESPONSE');
  expect(reserve).not.toHaveBeenCalled();
  expect(boundary).not.toHaveBeenCalled();
  await expect(
    routed.structured('account', {}, flashcardAIOutputSchema, 'cards', 'Gerar'),
  ).rejects.toHaveProperty('code', 'AI_INVALID_RESPONSE');
  expect(reserve).toHaveBeenCalledTimes(1);
});
