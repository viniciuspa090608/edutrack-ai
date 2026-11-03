import type { MouseEvent } from 'react';
import { navigate } from '../features/auth/auth-api.js';
import { moduleAtPath } from '../features/profile/module-catalog.js';

export function navigatePrivateLink(event: MouseEvent<HTMLElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== window.location.origin) return;
  if (
    ![
      '/app',
      '/conta',
      '/app/pomodoro',
      '/app/rotinas',
      '/app/estatisticas',
      '/app/progresso',
    ].includes(url.pathname) &&
    !moduleAtPath(url.pathname)
  )
    return;
  if (
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    url.hash
  )
    return;
  event.preventDefault();
  if (url.href === window.location.href) return;
  navigate(url.pathname + url.search + url.hash);
}
