import { useEffect, useRef } from 'react';

/** Consume only after the destination has loaded, retaining other URL state. */
export function useCreateIntent(ready: boolean, open: () => void) {
  const consumed = useRef(false);
  useEffect(() => {
    if (!ready || consumed.current) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('create') !== '1') return;
    consumed.current = true;
    url.searchParams.delete('create');
    window.history.replaceState(
      window.history.state,
      '',
      url.pathname + url.search + url.hash,
    );
    open();
  }, [ready, open]);
}
