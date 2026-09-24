import { meResponseSchema } from '@study-platform/contracts';
import type { AuthUser } from '@study-platform/contracts';

function apiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
}

export class AuthApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(
      status === 429
        ? 'Muitas tentativas. Tente novamente mais tarde.'
        : status === 401
          ? 'E-mail ou senha inválidos.'
          : status === 409
            ? 'Não foi possível usar este e-mail.'
            : 'Não foi possível concluir a ação. Tente novamente.',
    );
  }
}

async function send(
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
    throw new AuthApiError(response.status, code);
  }
  return response;
}

export async function currentUser(): Promise<AuthUser> {
  return meResponseSchema.parse(await (await send('/auth/me')).json()).user;
}

export async function localAccess(
  mode: 'register' | 'login',
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await send(`/auth/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return meResponseSchema.parse(await response.json()).user;
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
