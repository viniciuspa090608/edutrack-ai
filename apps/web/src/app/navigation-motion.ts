/** Visual completion must never gate the request that ends a session. */
export function waitForExit(element: HTMLElement | null): Promise<void> {
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!element || media?.matches) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      element.removeEventListener('animationend', end);
      element.removeEventListener('animationcancel', end);
      media?.removeEventListener('change', done);
      resolve();
    };
    const end = (event: Event) => {
      if (
        event.target === element &&
        (!('animationName' in event) || event.animationName === 'backOutLeft')
      )
        done();
    };
    const timer = setTimeout(done, 650);
    element.addEventListener('animationend', end);
    element.addEventListener('animationcancel', end);
    media?.addEventListener('change', done);
  });
}
