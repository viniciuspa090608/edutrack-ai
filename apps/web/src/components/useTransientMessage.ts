import { useCallback, useEffect, useState } from 'react';

export function useTransientMessage() {
  const [notice, setNotice] = useState<{ text: string } | null>(null);

  const show = useCallback((text: string) => {
    setNotice(text ? { text } : null);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return [notice?.text ?? '', show] as const;
}
