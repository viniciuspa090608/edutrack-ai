import { createSign, generateKeyPairSync } from 'node:crypto';
import type { CustomFetch } from 'openid-client';
import { classroomScopes } from '../src/modules/classroom/scopes.js';
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
export function classroomOIDCFixture() {
  const state = {
    nonce: '',
    scope: [...Object.values(classroomScopes)].join(' '),
    refreshRejected: false,
    refreshUnavailable: false,
  };
  function token() {
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', kid: 'classroom-key', typ: 'JWT' }),
    ).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        iss: 'https://accounts.google.com',
        aud: 'synthetic-client',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        sub: 'authorized-google-sub',
        email: 'authorized@example.test',
        email_verified: true,
        nonce: state.nonce,
      }),
    ).toString('base64url');
    const unsigned = `${header}.${body}`;
    return `${unsigned}.${createSign('RSA-SHA256').update(unsigned).end().sign(privateKey).toString('base64url')}`;
  }
  const transport: CustomFetch = async (input, options) => {
    const url = String(input);
    if (url.endsWith('/.well-known/openid-configuration'))
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
    if (url.endsWith('/keys'))
      return Response.json({
        keys: [
          {
            ...publicKey.export({ format: 'jwk' }),
            kid: 'classroom-key',
            alg: 'RS256',
            use: 'sig',
          },
        ],
      });
    if (url.endsWith('/token')) {
      const refresh = String(options?.body).includes('refresh_token');
      if (refresh && state.refreshUnavailable)
        return Response.json(
          { error: 'temporarily_unavailable' },
          { status: 503 },
        );
      if (refresh && state.refreshRejected)
        return Response.json({ error: 'invalid_grant' }, { status: 400 });
      return Response.json({
        access_token: refresh
          ? 'synthetic-refreshed-access'
          : 'synthetic-access',
        refresh_token: 'synthetic-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: state.scope,
        ...(!refresh ? { id_token: token() } : {}),
      });
    }
    throw new Error('Unexpected synthetic OIDC URL');
  };
  return { state, transport };
}
