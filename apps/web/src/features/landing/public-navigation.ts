import type { MouseEvent } from 'react';
import { navigate } from '../auth/auth-api.js';

/** Keep public route state in the SPA, while retaining real, shareable hrefs. */
export function navigatePublicLink(event: MouseEvent<HTMLElement>): void {
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
  if (
    url.origin !== window.location.origin ||
    url.hash ||
    !['/', '/acesso'].includes(url.pathname)
  )
    return;
  event.preventDefault();
  navigate(url.pathname + url.search);
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
