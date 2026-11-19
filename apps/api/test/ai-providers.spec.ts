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
it.each([502, 503, 504])(
  'retries transient assistant HTTP %i with a fresh quota reservation and the same snapshot',
  async (status) => {
    const snapshot = {
      provider: 'gemini' as const,
      model: aiModels.gemini[0],
      credential: canary,
      shared: true,
    };
    const resolve = vi.fn(async () => snapshot);
    const release = vi.fn(async () => {});
    const reserve = vi.fn(async () => release);
    const boundary = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status }))
      .mockResolvedValueOnce(
        Response.json(providerEnvelope('gemini', flashcardFixture)),
      );
    const transport = new StructuredProvider(
      { ...env, AI_TIMEOUT_MS: 3000, AI_ASSISTANT_RETRY_DELAY_MS: 100 },
      boundary,
    );
    const routed = new RoutedStructuredProvider(
      { resolve },
      { reserve },
      transport,
    );
    const onCall = vi.fn();
    await expect(
      routed.structured(
        'account',
        {},
        flashcardAIOutputSchema,
        'study_assistant',
        'Gerar',
        new Set(['gemini:' + snapshot.model]),
        onCall,
      ),
    ).resolves.toEqual(flashcardFixture);
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(reserve).toHaveBeenCalledTimes(2);
    expect(reserve).toHaveBeenNthCalledWith(2, 'account', true, true);
    expect(release).toHaveBeenCalledTimes(2);
    expect(onCall).toHaveBeenCalledTimes(2);
    expect(boundary.mock.calls[0]![0]).toBe(boundary.mock.calls[1]![0]);
    expect(boundary.mock.calls[0]![1]!.body).toBe(
      boundary.mock.calls[1]![1]!.body,
    );
    expect(
      JSON.parse(String(boundary.mock.calls[0]![1]!.body)).generationConfig
        .thinkingConfig,
    ).toEqual({ thinkingLevel: 'LOW' });
  },
);

it.each([400, 401, 403, 429, 500])(
  'does not retry assistant HTTP %i or switch provider',
  async (status) => {
    const boundary = vi.fn<typeof fetch>(
      async () => new Response(null, { status }),
    );
    const reserve = vi.fn(async () => async () => {});
    const routed = new RoutedStructuredProvider(
      {
        resolve: async () => ({
          provider: 'gemini',
          model: aiModels.gemini[0],
          credential: canary,
          shared: false,
        }),
      },
      { reserve },
      new StructuredProvider(env, boundary),
    );
    await expect(
      routed.structured(
        'account',
        {},
        flashcardAIOutputSchema,
        'study_assistant',
        'Gerar',
        new Set(['gemini:' + aiModels.gemini[0]]),
      ),
    ).rejects.toHaveProperty('code', expect.stringMatching(/^AI_/));
    expect(boundary).toHaveBeenCalledTimes(1);
    expect(reserve).toHaveBeenCalledTimes(1);
  },
);

it('stops retries at the configured bound and respects Retry-After and the total deadline', async () => {
  for (const headers of [{}, { 'retry-after': '120' }]) {
    const boundary = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 503, headers }),
    );
    const release = vi.fn(async () => {});
    const routed = new RoutedStructuredProvider(
      {
        resolve: async () => ({
          provider: 'gemini',
          model: aiModels.gemini[0],
          credential: canary,
          shared: true,
        }),
      },
      { reserve: async () => release },
      new StructuredProvider(
        { ...env, AI_TIMEOUT_MS: 3000, AI_ASSISTANT_RETRY_DELAY_MS: 100 },
        boundary,
      ),
    );
    await expect(
      routed.structured(
        'account',
        {},
        flashcardAIOutputSchema,
        'study_assistant',
        'Gerar',
        new Set(['gemini:' + aiModels.gemini[0]]),
      ),
    ).rejects.toHaveProperty('code', 'AI_UNAVAILABLE');
    expect(boundary).toHaveBeenCalledTimes('retry-after' in headers ? 1 : 2);
    expect(release).toHaveBeenCalledTimes(boundary.mock.calls.length);
  }
  const boundary = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 503 }),
  );
  const routed = new RoutedStructuredProvider(
    {
      resolve: async () => ({
        provider: 'gemini',
        model: aiModels.gemini[0],
        credential: canary,
        shared: true,
      }),
    },
    { reserve: async () => async () => {} },
    new StructuredProvider(env, boundary),
  );
  await expect(
    routed.structured(
      'account',
      {},
      flashcardAIOutputSchema,
      'study_assistant',
      'Gerar',
      new Set(['gemini:' + aiModels.gemini[0]]),
    ),
  ).rejects.toHaveProperty('code', 'AI_UNAVAILABLE');
  expect(boundary).toHaveBeenCalledTimes(1);
});

it('does not send a retry when the next quota reservation is rejected', async () => {
  const boundary = vi.fn<typeof fetch>(
    async () => new Response(null, { status: 503 }),
  );
  const release = vi.fn(async () => {});
  const reserve = vi
    .fn()
    .mockResolvedValueOnce(release)
    .mockRejectedValueOnce(new Error('QUOTA_BLOCKED'));
  const routed = new RoutedStructuredProvider(
    {
      resolve: async () => ({
        provider: 'gemini',
        model: aiModels.gemini[0],
        credential: canary,
        shared: true,
      }),
    },
    { reserve },
    new StructuredProvider(
      { ...env, AI_TIMEOUT_MS: 3000, AI_ASSISTANT_RETRY_DELAY_MS: 100 },
      boundary,
    ),
  );
  await expect(
    routed.structured(
      'account',
      {},
      flashcardAIOutputSchema,
      'study_assistant',
      'Gerar',
      new Set(['gemini:' + aiModels.gemini[0]]),
    ),
  ).rejects.toThrow('QUOTA_BLOCKED');
  expect(boundary).toHaveBeenCalledTimes(1);
  expect(reserve).toHaveBeenCalledTimes(2);
  expect(release).toHaveBeenCalledTimes(1);
});
