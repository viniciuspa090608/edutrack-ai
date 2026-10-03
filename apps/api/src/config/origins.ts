import type { ApiEnv } from './env.js';

export function webOrigins(env: ApiEnv): string[] {
  return [
    env.WEB_ORIGIN,
    ...(env.NODE_ENV === 'development' ? (env.DEV_WEB_ORIGINS ?? []) : []),
  ];
}

export function allowsWebOrigin(
  env: ApiEnv,
  origin: string | undefined,
): boolean {
  return origin !== undefined && webOrigins(env).includes(origin);
}
