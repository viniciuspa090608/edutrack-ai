import { randomBytes, randomUUID } from 'node:crypto';
import * as oidc from 'openid-client';
import { z } from 'zod';
import type { ApiEnv } from '../../config/env.js';
import { AuthRepository, isDuplicateKey } from './auth.repository.js';
import { OAuthRepository } from './oauth.repository.js';
import type { ActiveSession } from './session.repository.js';
import { SessionRepository } from './session.repository.js';
import { ProfileRepository } from './profile.repository.js';
import { HttpError } from '../../shared/http-error.js';

export type GoogleOutcome =
  | { kind: 'login'; token: string; returnTo: string }
  | { kind: 'linked'; returnTo: string }
  | { kind: 'reauthenticated'; returnTo: string }
  | { kind: 'conflict' | 'failed'; intent: 'login' | 'link' | 'reauth' };

export function allowedReturnTo(value: unknown): string {
  if (value === '/app/rotinas') return value;
  if (value === '/app/pomodoro') return value;
  if (value === '/app/tarefas') return value;
  return value === '/conta' ? '/conta' : '/app';
}

export class GoogleService {
  private configuration?: Promise<oidc.Configuration>;

  constructor(
    private readonly env: ApiEnv,
    private readonly users: AuthRepository,
    private readonly sessions: SessionRepository,
    private readonly attempts: OAuthRepository,
    private readonly providerFetch?: oidc.CustomFetch,
  ) {}

  private async config(): Promise<oidc.Configuration> {
    if (!this.env.GOOGLE_CLIENT_ID || !this.env.GOOGLE_CLIENT_SECRET)
      throw new Error('Google not configured');
    this.configuration ??= oidc.discovery(
      new URL('https://accounts.google.com'),
      this.env.GOOGLE_CLIENT_ID,
      this.env.GOOGLE_CLIENT_SECRET,
      undefined,
      {
        execute: [oidc.enableNonRepudiationChecks],
        ...(this.providerFetch
          ? { [oidc.customFetch]: this.providerFetch }
          : {}),
      },
    );
    return this.configuration;
  }

  async start(
    intent: 'login' | 'link' | 'reauth',
    returnTo: string,
    session?: ActiveSession,
  ): Promise<{ url: string; browserSecret: string }> {
    if (intent !== 'login' && !session)
      throw new Error('Session required for link');
    await this.attempts.cleanup();
    const config = await this.config();
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const browserSecret = randomBytes(32).toString('base64url');
    const challenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    await this.attempts.create(
      {
        id: randomUUID(),
        codeVerifier,
        nonce,
        intent,
        userId: session?.userId ?? null,
        sessionId: session?.id ?? null,
        returnTo: allowedReturnTo(returnTo),
      },
      state,
      browserSecret,
    );
    const url = oidc.buildAuthorizationUrl(config, {
      redirect_uri: `${this.env.API_PUBLIC_ORIGIN}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      nonce,
      ...(intent === 'reauth' ? { prompt: 'login', max_age: '0' } : {}),
    });
    return { url: url.href, browserSecret };
  }

  async callback(
    currentUrl: URL,
    browserSecret: string | undefined,
    currentSessionToken: string | undefined,
  ): Promise<GoogleOutcome> {
    const state = currentUrl.searchParams.get('state');
    if (!state || !browserSecret) return { kind: 'failed', intent: 'login' };
    const attempt = await this.attempts.consume(state, browserSecret);
    if (!attempt) return { kind: 'failed', intent: 'login' };
    if (currentUrl.searchParams.has('error'))
      return { kind: 'failed', intent: attempt.intent };
    try {
      const config = await this.config();
      const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
        expectedState: state,
        expectedNonce: attempt.nonce,
        pkceCodeVerifier: attempt.codeVerifier,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (
        !claims ||
        typeof claims.sub !== 'string' ||
        !claims.sub ||
        typeof claims.email !== 'string' ||
        !claims.email ||
        !z.email().safeParse(claims.email).success ||
        claims.email_verified !== true
      ) {
        return { kind: 'failed', intent: attempt.intent };
      }
      if (attempt.intent !== 'login') {
        const session = currentSessionToken
          ? await this.sessions.resolve(currentSessionToken)
          : null;
        if (
          !session ||
          session.id !== attempt.sessionId ||
          session.userId !== attempt.userId
        ) {
          return { kind: 'failed', intent: attempt.intent };
        }
        if (attempt.intent === 'reauth') {
          if (
            typeof claims.auth_time !== 'number' ||
            claims.auth_time < Math.floor(Date.now() / 1000) - 300 ||
            claims.auth_time > Math.floor(Date.now() / 1000) + 60
          )
            return { kind: 'failed', intent: 'reauth' };
          const linked = await this.users.googleUser(claims.sub);
          if (linked?.id !== session.userId)
            return { kind: 'failed', intent: 'reauth' };
          await new ProfileRepository(this.users.source).prove(session);
          return { kind: 'reauthenticated', returnTo: '/conta' };
        }
        try {
          await this.users.linkGoogle(session.userId, claims.sub, claims.email);
        } catch (error) {
          if (isDuplicateKey(error))
            return { kind: 'conflict', intent: 'link' };
          throw error;
        }
        return { kind: 'linked', returnTo: '/conta' };
      }
      let user = await this.users.googleUser(claims.sub);
      if (!user) {
        const email = claims.email.trim().toLowerCase();
        if (await this.users.userByEmail(email))
          return { kind: 'conflict', intent: 'login' };
        try {
          user = await this.users.createGoogle(email, claims.sub, claims.email);
        } catch (error) {
          if (
            !isDuplicateKey(error) &&
            !(error instanceof HttpError && error.code === 'EMAIL_UNAVAILABLE')
          )
            throw error;
          user = await this.users.googleUser(claims.sub);
          if (!user) return { kind: 'conflict', intent: 'login' };
        }
      }
      const token = await this.sessions.create(user.id, currentSessionToken);
      return { kind: 'login', token, returnTo: attempt.returnTo };
    } catch {
      return { kind: 'failed', intent: attempt.intent };
    }
  }
}
