import { randomBytes } from 'node:crypto';
import * as oidc from 'openid-client';
import { z } from 'zod';
import type { ApiEnv } from '../../config/env.js';
import type { ActiveSession } from '../auth/session.repository.js';
import { secretHash } from '../auth/session.repository.js';
import { HttpError } from '../../shared/http-error.js';
import { ClassroomRepository, json } from './classroom.repository.js';
import { ClassroomTokenCrypto } from './token-crypto.js';
import { classroomScopes, hasClassroomScope } from './scopes.js';
import { logger } from '../../shared/logger.js';

const tokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
  expiresAt: z.number(),
});
export class ClassroomOAuthService {
  private configuration?: Promise<oidc.Configuration>;
  constructor(
    private readonly repository: ClassroomRepository,
    private readonly env: ApiEnv,
    private readonly customFetch?: oidc.CustomFetch,
  ) {}
  get available() {
    return Boolean(
      this.env.GOOGLE_CLIENT_ID &&
      this.env.GOOGLE_CLIENT_SECRET &&
      this.env.CLASSROOM_ENCRYPTION_KEY,
    );
  }
  private crypto() {
    if (!this.available)
      throw new HttpError(
        503,
        'CLASSROOM_UNAVAILABLE',
        'Google Classroom ainda não está configurado. Você pode continuar e conectar depois.',
      );
    return new ClassroomTokenCrypto(this.env.CLASSROOM_ENCRYPTION_KEY!);
  }
  private config() {
    this.crypto();
    return (this.configuration ??= oidc.discovery(
      new URL('https://accounts.google.com'),
      this.env.GOOGLE_CLIENT_ID!,
      this.env.GOOGLE_CLIENT_SECRET!,
      undefined,
      {
        execute: [oidc.enableNonRepudiationChecks],
        ...(this.customFetch ? { [oidc.customFetch]: this.customFetch } : {}),
      },
    ));
  }
  private get redirectUri() {
    return `${this.env.API_PUBLIC_ORIGIN}/integrations/google-classroom/callback`;
  }
  async start(session: ActiveSession, purpose: 'import' | 'teacher') {
    const config = await this.config();
    const state = oidc.randomState(),
      nonce = oidc.randomNonce(),
      verifier = oidc.randomPKCECodeVerifier();
    const browserSecret = randomBytes(32).toString('base64url');
    await this.repository.attempt(
      session.userId,
      session.id,
      secretHash(state),
      secretHash(browserSecret),
      verifier,
      nonce,
      purpose,
    );
    const row = await this.repository.connection(session.userId);
    const existing =
      row?.state === 'connected'
        ? json<string[]>(row.scopes).filter((scope) =>
            Object.values(classroomScopes).some((required) =>
              hasClassroomScope([scope], required),
            ),
          )
        : [];
    const scopes = new Set([
      'openid',
      'email',
      classroomScopes.courses,
      classroomScopes.coursework,
      ...existing,
    ]);
    if (purpose === 'teacher') scopes.add(classroomScopes.teacherCoursework);
    const url = oidc.buildAuthorizationUrl(config, {
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: [...scopes].join(' '),
      state,
      nonce,
      code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent select_account',
    });
    return { url: url.href, browserSecret };
  }
  async callback(
    session: ActiveSession,
    url: URL,
    browserSecret: string | undefined,
  ) {
    const state = url.searchParams.get('state');
    if (!state || !browserSecret)
      throw new HttpError(
        400,
        'CLASSROOM_OAUTH_FAILED',
        'Autorização inválida. Tente conectar novamente.',
      );
    const attempt = await this.repository.consume(
      session.userId,
      session.id,
      secretHash(state),
      secretHash(browserSecret),
    );
    if (url.searchParams.has('error'))
      throw new HttpError(
        400,
        'CLASSROOM_CONSENT_DENIED',
        'O acesso ao Classroom não foi autorizado. Você pode continuar.',
      );
    let phase = 'grant';
    try {
      const response = await oidc.authorizationCodeGrant(
        await this.config(),
        url,
        {
          expectedState: state,
          expectedNonce: attempt.nonce,
          pkceCodeVerifier: attempt.verifier,
          idTokenExpected: true,
        },
      );
      phase = 'identity';
      const identity = z
        .object({
          sub: z.string().min(1).max(255),
          email: z.email(),
          email_verified: z.literal(true),
        })
        .parse(response.claims());
      phase = 'scopes';
      const scopes = (response.scope ?? '').split(' ');
      if (
        ![classroomScopes.courses, classroomScopes.coursework].every((scope) =>
          hasClassroomScope(scopes, scope),
        )
      ) {
        logger.error({
          event: 'classroom.scopes_incomplete',
          grantedScopes: scopes.filter(
            (scope) =>
              scope === 'openid' ||
              /^https:\/\/www\.googleapis\.com\/auth\/[A-Za-z0-9._-]+$/.test(
                scope,
              ),
          ),
        });
        throw new HttpError(
          403,
          'CLASSROOM_SCOPES_MISSING',
          'Autorize a leitura de turmas e atividades para importar.',
        );
      }
      phase = 'credentials';
      const old = await this.repository.connection(session.userId);
      let refreshToken = response.refresh_token;
      if (
        !refreshToken &&
        old?.google_subject === identity.sub &&
        old.encrypted_tokens
      )
        refreshToken = tokensSchema.parse(
          this.crypto().decrypt(session.userId, old.encrypted_tokens),
        ).refreshToken;
      if (!refreshToken)
        throw new HttpError(
          403,
          'CLASSROOM_RECONNECT_REQUIRED',
          'Reconecte autorizando o acesso para concluir a integração.',
        );
      const encrypted = this.crypto().encrypt(session.userId, {
        accessToken: response.access_token,
        refreshToken,
        expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
      });
      phase = 'save';
      await this.repository.saveConnection(
        session.userId,
        attempt.connection_version,
        identity.sub,
        identity.email,
        scopes,
        encrypted,
      );
    } catch (error) {
      const code =
        error instanceof Error &&
        'code' in error &&
        typeof error.code === 'string' &&
        /^[A-Z_]{1,60}$/.test(error.code)
          ? error.code
          : undefined;
      logger.error({
        event: 'classroom.authorization_failed',
        phase,
        errorType: error instanceof Error ? error.name : 'unknown',
        code,
        validationFields:
          error instanceof z.ZodError
            ? error.issues.map((issue) => issue.path.join('.'))
            : undefined,
      });
      if (error instanceof HttpError) throw error;
      throw new HttpError(
        400,
        'CLASSROOM_OAUTH_FAILED',
        'Não foi possível autorizar o Classroom. Tente conectar novamente.',
      );
    }
  }
  async access(userId: string, version: number, required: string[]) {
    const row = await this.repository.connection(userId);
    if (
      !row?.encrypted_tokens ||
      row.state !== 'connected' ||
      row.version !== version
    )
      throw new HttpError(
        409,
        'CLASSROOM_RECONNECT_REQUIRED',
        'Reconecte o Google Classroom.',
      );
    if (
      !required.every((scope) =>
        hasClassroomScope(json<string[]>(row.scopes), scope),
      )
    )
      throw new HttpError(
        403,
        'CLASSROOM_SCOPES_MISSING',
        'Autorize as permissões adicionais necessárias.',
      );
    const tokens = tokensSchema.parse(
      this.crypto().decrypt(userId, row.encrypted_tokens),
    );
    if (tokens.expiresAt > Date.now() + 60000) return tokens.accessToken;
    if (!tokens.refreshToken)
      throw new HttpError(
        409,
        'CLASSROOM_RECONNECT_REQUIRED',
        'Reconecte o Google Classroom.',
      );
    try {
      const refreshed = await oidc.refreshTokenGrant(
        await this.config(),
        tokens.refreshToken,
      );
      const encrypted = this.crypto().encrypt(userId, {
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
        expiresAt: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      });
      await this.repository.source.query(
        "UPDATE classroom_connections SET encrypted_tokens=? WHERE user_id=? AND version=? AND state='connected'",
        [encrypted, userId, version],
      );
      return refreshed.access_token;
    } catch (error) {
      if (
        !(error instanceof oidc.ResponseBodyError) ||
        error.error !== 'invalid_grant'
      )
        throw new HttpError(
          503,
          'CLASSROOM_TEMPORARILY_UNAVAILABLE',
          'O Google está temporariamente indisponível para renovar o acesso. Aguarde e tente novamente.',
        );
      await this.repository.source.query(
        "UPDATE classroom_connections SET state='reconnect_required',encrypted_tokens=NULL WHERE user_id=? AND version=?",
        [userId, version],
      );
      throw new HttpError(
        409,
        'CLASSROOM_RECONNECT_REQUIRED',
        'O Google revogou ou expirou o acesso. Reconecte a conta.',
      );
    }
  }
  async disconnect(userId: string) {
    const encrypted = await this.repository.disconnect(userId);
    if (!encrypted) return { revocationConfirmed: true };
    try {
      const tokens = tokensSchema.parse(
        this.crypto().decrypt(userId, encrypted),
      );
      const response = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: tokens.refreshToken ?? tokens.accessToken,
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      });
      return { revocationConfirmed: response.ok };
    } catch {
      return { revocationConfirmed: false };
    }
  }
}
