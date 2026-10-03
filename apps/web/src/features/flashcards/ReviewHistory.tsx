import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@study-platform/ui/components/ui/pagination';

import { Button } from '@study-platform/ui/components/ui/button';
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
    <Card asChild>
      <section className="flashcard-panel" aria-label="Histórico de revisões">
        <CardHeader>
          <h3 ref={heading} tabIndex={-1}>
            Histórico de revisões
          </h3>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                Não foi possível carregar o histórico.{' '}
                <Button onClick={() => setRetry(retry + 1)}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : !result ? (
            <div>
              <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
              <p role="status">Carregando histórico…</p>
            </div>
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
                      Intervalo: {event.intervalSeconds / 60} minutos. Geração
                      do conteúdo: {event.contentGeneration}. Política:{' '}
                      {event.policyId}-v{event.policyVersion}.
                    </p>
                  </li>
                ))}
              </ol>
              <Pagination aria-label="Páginas do histórico">
                <PaginationContent className="flex-wrap">
                  <PaginationItem>
                    <Button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <span>
                      Página {page} de {Math.max(1, result.totalPages)}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      disabled={page >= result.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Próxima
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
          <Button onClick={onClose}>Fechar histórico</Button>
        </CardContent>
      </section>
    </Card>
  );
}
