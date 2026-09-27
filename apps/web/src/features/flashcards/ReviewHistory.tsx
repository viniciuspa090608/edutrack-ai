import { useEffect, useState, useRef } from 'react';
import type { ReviewHistory as History } from '@study-platform/contracts';
import { reviewHistory } from './reviews-api.js';
export function ReviewHistory({
  deckId,
  cardId,
  onClose,
}: {
  deckId: string;
  cardId: string;
  onClose: () => void;
}) {
  const [result, setResult] = useState<History | null>(null),
    [error, setError] = useState(false),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    let active = true;
    setResult(null);
    setError(false);
    void reviewHistory(deckId, cardId, page)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [deckId, cardId, page, retry]);
  return (
    <section className="flashcard-panel" aria-label="Histórico de revisões">
      <h3 ref={heading} tabIndex={-1}>
        Histórico de revisões
      </h3>
      {error ? (
        <p role="alert">
          Não foi possível carregar o histórico.{' '}
          <button onClick={() => setRetry(retry + 1)}>Tentar novamente</button>
        </p>
      ) : !result ? (
        <p role="status">Carregando histórico…</p>
      ) : (
        <>
          {!result.items.length && <p>Nenhuma avaliação registrada.</p>}
          <ol>
            {result.items.map((event) => (
              <li key={event.id}>
                <strong>{event.rating}</strong>
                <p>
                  Avaliado em {new Date(event.reviewedAt).toLocaleString()}.
                  Próxima revisão: {new Date(event.dueAt).toLocaleString()}.
                </p>
                <p>
                  Intervalo: {event.intervalSeconds / 60} minutos. Geração do
                  conteúdo: {event.contentGeneration}. Política:{' '}
                  {event.policyId}-v{event.policyVersion}.
                </p>
              </li>
            ))}
          </ol>
          <nav aria-label="Páginas do histórico">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Anterior
            </button>
            <span>
              Página {page} de {Math.max(1, result.totalPages)}
            </span>
            <button
              disabled={page >= result.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </button>
          </nav>
        </>
      )}
      <button onClick={onClose}>Fechar histórico</button>
    </section>
  );
}
