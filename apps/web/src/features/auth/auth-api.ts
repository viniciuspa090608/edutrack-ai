import {
  meResponseSchema,
  pendingVerificationSchema,
} from '@study-platform/contracts';
import type { AuthUser } from '@study-platform/contracts';

function apiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
}

export class AuthApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryAfter?: number,
  ) {
    super(
      status === 429
        ? `Aguarde ${retryAfter ?? 60} segundos antes de tentar novamente.`
        : code === 'INVALID_CODE'
          ? 'Código inválido ou expirado. Solicite outro se necessário.'
          : code === 'LAST_MODULE_REQUIRED'
            ? 'Mantenha pelo menos um módulo de estudo ativo: tarefas, matérias ou flashcards.'
            : code === 'INVALID_RESET_GRANT'
              ? 'O prazo da redefinição terminou. Solicite outro código.'
              : code === 'IDENTITY_PROOF_REQUIRED'
                ? 'Confirme novamente sua identidade para alterar o e-mail.'
                : code === 'INVALID_AVATAR' || code === 'PAYLOAD_TOO_LARGE'
                  ? 'Use JPEG, PNG ou WebP estático de até 2 MiB, entre 64 e 4096 pixels por lado e até 16 milhões de pixels.'
                  : code === 'ALREADY_VERIFIED'
                    ? 'Seu e-mail já foi confirmado. Volte para a entrada.'
                    : code === 'UNAUTHENTICATED'
                      ? 'Seu acesso temporário expirou. Entre novamente para continuar.'
                      : status === 401
                        ? 'E-mail ou senha inválidos.'
                        : status === 409
                          ? 'Não foi possível usar este e-mail.'
                          : 'Não foi possível concluir a ação. Tente novamente.',
    );
  }
}

export async function send(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const code =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'object' &&
      body.error !== null &&
      'code' in body.error &&
      typeof body.error.code === 'string'
        ? body.error.code
        : 'UNKNOWN';
    const retryHeader = response.headers?.get('Retry-After');
    const retryAfter =
      retryHeader && /^\d+$/.test(retryHeader)
        ? Number(retryHeader)
        : undefined;
    throw new AuthApiError(response.status, code, retryAfter);
  }
  return response;
}

async function postJson(path: string, body: object): Promise<Response> {
  return send(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function currentUser(): Promise<AuthUser> {
  return meResponseSchema.parse(await (await send('/auth/me')).json()).user;
}

export async function localAccess(
  mode: 'register' | 'login',
  email: string,
  password: string,
): Promise<{ kind: 'active'; user: AuthUser } | { kind: 'pending' }> {
  const body: unknown = await (
    await postJson(`/auth/${mode}`, { email, password })
  ).json();
  if (pendingVerificationSchema.safeParse(body).success)
    return { kind: 'pending' };
  return { kind: 'active', user: meResponseSchema.parse(body).user };
}

export async function confirmEmail(code: string): Promise<void> {
  await postJson('/auth/email-verification/confirm', { code });
}
export async function resendEmail(): Promise<void> {
  await postJson('/auth/email-verification/resend', {});
}
export async function requestRecovery(email: string): Promise<string> {
  const body: unknown = await (
    await postJson('/auth/password-recovery/request', { email })
  ).json();
  if (
    !body ||
    typeof body !== 'object' ||
    !('message' in body) ||
    typeof body.message !== 'string'
  )
    throw new Error('Resposta inválida.');
  return body.message;
}
export async function verifyRecovery(
  email: string,
  code: string,
): Promise<void> {
  await postJson('/auth/password-recovery/verify', { email, code });
}
export async function resetPassword(password: string): Promise<void> {
  await postJson('/auth/password-recovery/reset', { password });
}

export async function logout(): Promise<void> {
  await send('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}

export async function startGoogleLink(): Promise<string> {
  const body: unknown = await (
    await send('/auth/google/link/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
  ).json();
  if (
    typeof body !== 'object' ||
    body === null ||
    !('url' in body) ||
    typeof body.url !== 'string'
  ) {
    throw new Error('Invalid Google response');
  }
  return body.url;
}

export function googleLoginUrl(returnTo: string): string {
  const url = new URL('/auth/google/start', apiBase());
  url.searchParams.set('returnTo', allowedReturnTo(returnTo));
  return url.href;
}

export function allowedReturnTo(value: unknown): '/app' | '/conta' {
  return value === '/conta' ? '/conta' : '/app';
}

export function navigate(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
