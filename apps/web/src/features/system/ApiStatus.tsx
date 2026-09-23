import { healthResponseSchema } from '@study-platform/contracts';
import { StatusPanel } from '@study-platform/ui';
import { useEffect, useState } from 'react';

type Status = 'loading' | 'success' | 'error';

export function ApiStatus() {
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    async function check() {
      try {
        const response = await fetch(
          new URL('/health', import.meta.env.VITE_API_BASE_URL),
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error('API indisponível');
        healthResponseSchema.parse(await response.json());
        if (!controller.signal.aborted) setStatus('success');
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }

    void check();
    return () => controller.abort();
  }, [attempt]);

  if (status === 'loading') {
    return (
      <StatusPanel
        tone="loading"
        title="Verificando API"
        message="Aguarde um instante."
      />
    );
  }

  if (status === 'success') {
    return (
      <StatusPanel
        tone="success"
        title="API disponível"
        message="O health check respondeu normalmente."
      />
    );
  }

  return (
    <StatusPanel
      tone="error"
      title="API indisponível"
      message="A página continua disponível. Confira a API e tente novamente."
      onRetry={() => setAttempt((value) => value + 1)}
    />
  );
}
