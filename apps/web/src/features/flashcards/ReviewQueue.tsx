import { useEffect, useRef, useState } from 'react';
import type {
  PendingList,
  ReviewRequest,
  ReviewRating,
  ScheduledCard,
  ReviewEvent,
} from '@study-platform/contracts';
import { AuthApiError } from '../auth/auth-api.js';
import { pendingReviews, scheduledCard, rateCard } from './reviews-api.js';
import { ReviewHistory } from './ReviewHistory.js';
const ratings: Record<ReviewRating, string> = {
  AGAIN: 'De novo (AGAIN)',
  HARD: 'Difícil (HARD)',
  GOOD: 'Bom (GOOD)',
  EASY: 'Fácil (EASY)',
};
export function ReviewQueue({
  deckId,
  onClose,
}: {
  deckId?: string | undefined;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState(''),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [list, setList] = useState<PendingList | null>(null),
    [listError, setListError] = useState(false);
  const [session, setSession] = useState<ScheduledCard | null>(null),
    [revealed, setRevealed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState<ReviewEvent | null>(null),
    [history, setHistory] = useState(false),
    [conflict, setConflict] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null),
    sessionHeading = useRef<HTMLHeadingElement>(null),
    historyButton = useRef<HTMLButtonElement>(null),
    sending = useRef(false),
    request = useRef<ReviewRequest | null>(null),
    active = useRef(true);
  useEffect(() => {
    sessionHeading.current?.focus();
  }, [session?.card.id, revealed, result?.id]);
  useEffect(() => {
    heading.current?.focus();
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setList(null);
    setListError(false);
    void pendingReviews(page, filter || undefined)
      .then((value) => {
        if (!active) return;
        if (page > 1 && !value.items.length) {
          setPage(Math.max(1, value.totalPages));
          return;
        }
        setList(value);
      })
      .catch(() => {
        if (active) setListError(true);
      });
    return () => {
      active = false;
    };
  }, [page, filter, retry]);
  async function open(item: PendingList['items'][number]) {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError('');
    setSession(null);
    setResult(null);
    setRevealed(false);
    setHistory(false);
    setConflict(false);
    request.current = null;
    try {
      const card = await scheduledCard(item.deckId, item.id);
      if (active.current) setSession(card);
    } catch {
      if (active.current)
        setError('Não foi possível abrir o cartão. Tente novamente.');
    } finally {
      sending.current = false;
      if (active.current) setBusy(false);
    }
  }
  async function rate(rating: ReviewRating) {
    if (!session || !revealed || sending.current) return;
    const payload = request.current ?? {
      rating,
      expectedRevision: session.state.revision,
      idempotencyKey: crypto.randomUUID(),
    };
    request.current = payload;
    sending.current = true;
    setBusy(true);
    setError('');
    try {
      const event = await rateCard(
        session.card.deckId,
        session.card.id,
        payload,
      );
      if (active.current) {
        setResult(event);
        setRetry((value) => value + 1);
      }
    } catch (cause) {
      if (active.current) {
        if (cause instanceof AuthApiError && cause.status === 409) {
          setConflict(true);
          setError(
            'O cartão foi atualizado ou ainda não está pendente. Recarregue a fila para continuar.',
          );
        } else
          setError(
            'Não foi possível confirmar. Tente novamente com a mesma avaliação; o pedido não será duplicado.',
          );
      }
    } finally {
      sending.current = false;
      if (active.current) setBusy(false);
    }
  }
  function finish() {
    setSession(null);
    setResult(null);
    setHistory(false);
    request.current = null;
    setRevealed(false);
    heading.current?.focus();
  }
  return (
    <section
      className="flashcard-panel review-queue"
      aria-label="Revisões pendentes"
    >
      <h2 ref={heading} tabIndex={-1}>
        Revisões pendentes
      </h2>
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">Processando revisão…</p>}
      {session ? (
        <section className="flashcard-panel" aria-label="Sessão de revisão">
          <h3 ref={sessionHeading} tabIndex={-1}>
            Frente
          </h3>
          <p className="flashcard-text">{session.card.front}</p>
          {revealed && (
            <div aria-live="polite">
              <h4>Resposta</h4>
              <p className="flashcard-text">{session.card.back}</p>
            </div>
          )}
          {result ? (
            <>
              <p role="status">
                Avaliação registrada. Próxima revisão:{' '}
                {new Date(result.dueAt).toLocaleString()}.
              </p>
              <button
                disabled={!list || listError}
                onClick={() => {
                  const next = list?.items.find(
                    (item) => item.id !== session.card.id,
                  );
                  if (next) void open(next);
                  else finish();
                }}
              >
                Próximo cartão
              </button>
            </>
          ) : (
            <>
              {!revealed ? (
                <button onClick={() => setRevealed(true)}>
                  Revelar resposta
                </button>
              ) : (
                <div className="flashcard-actions">
                  {(Object.keys(ratings) as ReviewRating[]).map((rating) => (
                    <button
                      key={rating}
                      disabled={
                        busy ||
                        conflict ||
                        (!!request.current && request.current.rating !== rating)
                      }
                      onClick={() => void rate(rating)}
                    >
                      {ratings[rating]}
                    </button>
                  ))}
                </div>
              )}
              {conflict && (
                <button
                  onClick={() => {
                    finish();
                    setConflict(false);
                    setError('');
                    setRetry(retry + 1);
                  }}
                >
                  Recarregar fila
                </button>
              )}
            </>
          )}
          <button
            ref={historyButton}
            disabled={busy}
            onClick={() => setHistory(true)}
          >
            Ver histórico
          </button>
          <button disabled={busy} onClick={finish}>
            Sair da sessão
          </button>
          {history && (
            <ReviewHistory
              deckId={session.card.deckId}
              cardId={session.card.id}
              onClose={() => {
                setHistory(false);
                historyButton.current?.focus();
              }}
            />
          )}
        </section>
      ) : (
        <>
          {deckId && (
            <label>
              Filtrar revisões
              <select
                value={filter}
                onChange={(event) => {
                  setFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos os baralhos</option>
                <option value={deckId}>Somente baralho aberto</option>
              </select>
            </label>
          )}
          {listError ? (
            <p role="alert">
              Não foi possível carregar pendências.{' '}
              <button onClick={() => setRetry(retry + 1)}>
                Tentar novamente
              </button>
            </p>
          ) : !list ? (
            <p role="status">Carregando pendências…</p>
          ) : (
            <>
              <p role="status">{list.total} cartões pendentes.</p>
              {!list.items.length && <p>Nenhuma revisão pendente agora.</p>}
              <ul className="flashcard-list">
                {list.items.map((item) => (
                  <li key={item.id}>
                    <h3>{item.deckName}</h3>
                    <p className="flashcard-text">{item.front}</p>
                    <p>Vencimento: {new Date(item.dueAt).toLocaleString()}</p>
                    <button disabled={busy} onClick={() => void open(item)}>
                      Revisar cartão
                    </button>
                  </li>
                ))}
              </ul>
              <nav aria-label="Páginas das pendências">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Anterior
                </button>
                <span>
                  Página {page} de {Math.max(1, list.totalPages)}
                </span>
                <button
                  disabled={page >= list.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </button>
              </nav>
            </>
          )}
        </>
      )}
      <button disabled={busy} onClick={onClose}>
        Fechar revisões
      </button>
    </section>
  );
}
