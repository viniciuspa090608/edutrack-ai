import {
  createSign,
  generateKeyPairSync,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import type * as oidc from 'openid-client';
import pino from 'pino';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadEnv } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { createDataSource } from '../src/database/data-source.js';
import { CreateAuthentication20260924221500 } from '../src/database/migrations/20260924221500-CreateAuthentication.js';
import { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { GoogleService } from '../src/modules/auth/google.service.js';
import { OAuthRepository } from '../src/modules/auth/oauth.repository.js';
import { SessionRepository } from '../src/modules/auth/session.repository.js';

const env = {
  ...loadEnv(),
  GOOGLE_CLIENT_ID: 'test-client',
  GOOGLE_CLIENT_SECRET: 'test-secret',
};
const database = `${env.TEST_DB_NAME}_oidc_${randomBytes(4).toString('hex')}`;
const admin = createDataSource({ ...env, DB_NAME: env.TEST_DB_NAME });
const source = new DataSource({
  ...createDataSource({ ...env, DB_NAME: database }).options,
  migrations: [CreateAuthentication20260924221500],
});
const users = new AuthRepository(source);
const sessions = new SessionRepository(source);
const attempts = new OAuthRepository(source);
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const publicJwk = publicKey.export({ format: 'jwk' });
let claims = {
  sub: 'google-sub',
  email: 'google@example.com',
  email_verified: true,
  nonce: '',
};
let audience = 'test-client';
let expiresIn = 3600;
let invalidSignature = false;

function idToken(): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      iss: 'https://accounts.google.com',
      aud: audience,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
      ...claims,
    }),
  ).toString('base64url');
  const unsigned = `${header}.${body}`;
  const signature = invalidSignature
    ? Buffer.alloc(256).toString('base64url')
    : createSign('RSA-SHA256')
        .update(unsigned)
        .end()
        .sign(privateKey)
        .toString('base64url');
  return `${unsigned}.${signature}`;
}

const providerFetch: oidc.CustomFetch = async (input) => {
  const url = String(input);
  if (url.endsWith('/.well-known/openid-configuration')) {
    return Response.json({
      issuer: 'https://accounts.google.com',
      authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      token_endpoint: 'https://accounts.google.com/token',
      jwks_uri: 'https://accounts.google.com/keys',
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      code_challenge_methods_supported: ['S256'],
    });
  }
  if (url.endsWith('/keys'))
    return Response.json({
      keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256', use: 'sig' }],
    });
  if (url.endsWith('/token'))
    return Response.json({
      access_token: 'not-stored',
      token_type: 'Bearer',
      expires_in: 3600,
      id_token: idToken(),
    });
  throw new Error('Unexpected provider endpoint');
};

const google = new GoogleService(env, users, sessions, attempts, providerFetch);

function callbackUrl(startUrl: string): URL {
  const state = new URL(startUrl).searchParams.get('state');
  return new URL(
    `${env.API_PUBLIC_ORIGIN}/auth/google/callback?code=good&state=${state}`,
  );
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

describe('Google OIDC identity', () => {
  it('sets a browser attempt cookie, then clears it on the callback', async () => {
    const app = createApp({
      logger: pino({ level: 'silent' }),
      webOrigin: env.WEB_ORIGIN,
      env,
      source,
      oidcFetch: providerFetch,
    });
    claims = {
      sub: randomUUID(),
      email: `${randomUUID()}@example.com`,
      email_verified: true,
      nonce: '',
    };
    const started = await request(app).get(
      '/auth/google/start?returnTo=%2Fapp',
    );
    expect(started.status).toBe(302);
    if (!started.headers.location) throw new Error('Google redirect missing');
    const authorization = new URL(started.headers.location);
    claims.nonce = authorization.searchParams.get('nonce') ?? '';
    const state = authorization.searchParams.get('state');
    const attemptCookie = (
      started.headers['set-cookie'] as unknown as string[]
    )[0]?.split(';')[0];
    if (!attemptCookie) throw new Error('OAuth cookie missing');
    const callback = await request(app)
      .get(`/auth/google/callback?code=good&state=${state}`)
      .set('Cookie', attemptCookie);
    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe(`${env.WEB_ORIGIN}/app`);
    const cookies = callback.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((value) => value.startsWith('edutrack_oauth=;'))).toBe(
      true,
    );
    expect(cookies.some((value) => value.startsWith('edutrack_session='))).toBe(
      true,
    );
  });

  it('requires PKCE, state, nonce and a single browser-bound attempt', async () => {
    claims = {
      sub: randomUUID(),
      email: `${randomUUID()}@example.com`,
      email_verified: true,
      nonce: '',
    };
    const started = await google.start('login', '/app');
    const authorization = new URL(started.url);
    expect(authorization.searchParams.get('code_challenge_method')).toBe(
      'S256',
    );
    expect(authorization.searchParams.get('scope')).toBe(
      'openid email profile',
    );
    claims.nonce = authorization.searchParams.get('nonce') ?? '';
    const callback = callbackUrl(started.url);
    expect(
      (await google.callback(callback, 'wrong-browser', undefined)).kind,
    ).toBe('failed');
    const success = await google.callback(
      callback,
      started.browserSecret,
      undefined,
    );
    expect(success.kind).toBe('login');
    if (success.kind === 'login')
      expect((await sessions.resolve(success.token))?.userId).toBe(
        (await users.googleUser(claims.sub))?.id,
      );
    expect(
      (await google.callback(callback, started.browserSecret, undefined)).kind,
    ).toBe('failed');
  });

  it('uses sub when Google reports another email', async () => {
    const subject = claims.sub;
    const original = await users.googleUser(subject);
    claims = {
      sub: subject,
      email: `${randomUUID()}@example.com`,
      email_verified: true,
      nonce: '',
    };
    const started = await google.start('login', '/conta');
    claims.nonce = new URL(started.url).searchParams.get('nonce') ?? '';
    const result = await google.callback(
      callbackUrl(started.url),
      started.browserSecret,
      undefined,
    );
    expect(result.kind).toBe('login');
    expect((await users.googleUser(subject))?.id).toBe(original?.id);
    expect((await users.googleUser(subject))?.email).toBe(original?.email);
  });

  it('does not auto-link a matching local email', async () => {
    const email = `${randomUUID()}@example.com`;
    await users.createLocal(email, Buffer.alloc(64), Buffer.alloc(32));
    claims = { sub: randomUUID(), email, email_verified: true, nonce: '' };
    const started = await google.start('login', '/app');
    claims.nonce = new URL(started.url).searchParams.get('nonce') ?? '';
    expect(
      (
        await google.callback(
          callbackUrl(started.url),
          started.browserSecret,
          undefined,
        )
      ).kind,
    ).toBe('conflict');
    expect(await users.googleUser(claims.sub)).toBeNull();
  });

  it('links only to the same live session and preserves local credentials', async () => {
    const local = await users.createLocal(
      `${randomUUID()}@example.com`,
      Buffer.alloc(64),
      Buffer.alloc(32),
    );
    const token = await sessions.create(local.id);
    const session = await sessions.resolve(token);
    if (!session) throw new Error('Session missing');
    claims = {
      sub: randomUUID(),
      email: `${randomUUID()}@example.com`,
      email_verified: true,
      nonce: '',
    };
    const started = await google.start('link', '/conta', session);
    claims.nonce = new URL(started.url).searchParams.get('nonce') ?? '';
    expect(
      (
        await google.callback(
          callbackUrl(started.url),
          started.browserSecret,
          undefined,
        )
      ).kind,
    ).toBe('failed');
    const retry = await google.start('link', '/conta', session);
    claims.nonce = new URL(retry.url).searchParams.get('nonce') ?? '';
    expect(
      (
        await google.callback(
          callbackUrl(retry.url),
          retry.browserSecret,
          token,
        )
      ).kind,
    ).toBe('linked');
    expect((await users.googleUser(claims.sub))?.id).toBe(local.id);
    expect(await users.passwordByEmail(local.email)).not.toBeNull();
  });

  it('rejects expired attempts and invalid nonce or unverified email', async () => {
    claims = {
      sub: randomUUID(),
      email: `${randomUUID()}@example.com`,
      email_verified: true,
      nonce: 'wrong',
    };
    const invalid = await google.start('login', '/app');
    expect(
      (
        await google.callback(
          callbackUrl(invalid.url),
          invalid.browserSecret,
          undefined,
        )
      ).kind,
    ).toBe('failed');
    const expired = await google.start('login', '/app');
    await source.query(
      'UPDATE oauth_attempts SET expires_at = DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 SECOND) WHERE consumed_at IS NULL',
    );
    expect(
      (
        await google.callback(
          callbackUrl(expired.url),
          expired.browserSecret,
          undefined,
        )
      ).kind,
    ).toBe('failed');
    claims = {
      sub: randomUUID(),
      email: `${randomUUID()}@example.com`,
      email_verified: false,
      nonce: '',
    };
    const unverified = await google.start('login', '/app');
    claims.nonce = new URL(unverified.url).searchParams.get('nonce') ?? '';
    expect(
      (
        await google.callback(
          callbackUrl(unverified.url),
          unverified.browserSecret,
          undefined,
        )
      ).kind,
    ).toBe('failed');
  });

  it('rejects invalid signature, audience, and token expiry', async () => {
    for (const mode of ['signature', 'audience', 'expiry']) {
      claims = {
        sub: randomUUID(),
        email: `${randomUUID()}@example.com`,
        email_verified: true,
        nonce: '',
      };
      const started = await google.start('login', '/app');
      claims.nonce = new URL(started.url).searchParams.get('nonce') ?? '';
      invalidSignature = mode === 'signature';
      audience = mode === 'audience' ? 'other-client' : 'test-client';
      expiresIn = mode === 'expiry' ? -3600 : 3600;
      expect(
        (
          await google.callback(
            callbackUrl(started.url),
            started.browserSecret,
            undefined,
          )
        ).kind,
        mode,
      ).toBe('failed');
      invalidSignature = false;
      audience = 'test-client';
      expiresIn = 3600;
    }
  });

  it('does not transfer an occupied Google subject during explicit link', async () => {
    const owner = await users.createGoogle(
      `${randomUUID()}@example.com`,
      randomUUID(),
      'owner@example.com',
    );
    const local = await users.createLocal(
      `${randomUUID()}@example.com`,
      Buffer.alloc(64),
      Buffer.alloc(32),
    );
    const ownerSubject = await source.query(
      'SELECT subject FROM external_identities WHERE user_id = ?',
      [owner.id],
    );
    const token = await sessions.create(local.id);
    const session = await sessions.resolve(token);
    if (!session) throw new Error('Session missing');
    claims = {
      sub: ownerSubject[0].subject,
      email: `${randomUUID()}@example.com`,
      email_verified: true,
      nonce: '',
    };
    const started = await google.start('link', '/conta', session);
    claims.nonce = new URL(started.url).searchParams.get('nonce') ?? '';
    expect(
      (
        await google.callback(
          callbackUrl(started.url),
          started.browserSecret,
          token,
        )
      ).kind,
    ).toBe('conflict');
    expect((await users.googleUser(claims.sub))?.id).toBe(owner.id);
    expect(await sessions.resolve(token)).not.toBeNull();
  });

  it('refuses link when its initiating session was revoked', async () => {
    const local = await users.createLocal(
      `${randomUUID()}@example.com`,
      Buffer.alloc(64),
      Buffer.alloc(32),
    );
    const token = await sessions.create(local.id);
    const session = await sessions.resolve(token);
    if (!session) throw new Error('Session missing');
    claims = {
      sub: randomUUID(),
      email: `${randomUUID()}@example.com`,
      email_verified: true,
      nonce: '',
    };
    const started = await google.start('link', '/conta', session);
    claims.nonce = new URL(started.url).searchParams.get('nonce') ?? '';
    await sessions.revoke(token);
    expect(
      (
        await google.callback(
          callbackUrl(started.url),
          started.browserSecret,
          token,
        )
      ).kind,
    ).toBe('failed');
    expect(await users.googleUser(claims.sub)).toBeNull();
  });
});
