import type { MouseEvent } from 'react';

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
    !['/', '/acesso', '/recuperar-senha'].includes(url.pathname)
  )
    return;
  event.preventDefault();
  navigatePublicRoute(url.pathname + url.search);
}

export function navigatePublicRoute(path: string): void {
  const from = window.location.pathname;
  const to = new URL(path, window.location.origin).pathname;
  const accessArrival =
    (from === '/' && to === '/acesso') ||
    (from === '/acesso' && to === '/recuperar-senha');
  const returnArrival =
    (from === '/acesso' && to === '/') ||
    (from === '/recuperar-senha' && to === '/acesso');
  window.history.pushState(
    accessArrival ? { accessArrival } : returnArrival ? { returnArrival } : {},
    '',
    path,
  );
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
