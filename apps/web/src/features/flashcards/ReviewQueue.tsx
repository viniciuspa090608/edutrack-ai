import { useEffect, useRef, useState } from 'react';
import type {
  ReviewRequest,
  ReviewRating,
  ScheduledCard,
} from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import {
  Alert,
  AlertDescription,
} from '@study-platform/ui/components/ui/alert';
import { Separator } from '@study-platform/ui/components/ui/separator';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import { AuthApiError } from '../auth/auth-api.js';
import { pendingReviews, scheduledCard, rateCard } from './reviews-api.js';
import type { ReviewScope } from './reviews-api.js';
import { ReviewHistory } from './ReviewHistory.js';

const ratings: Record<ReviewRating, string> = {
  AGAIN: 'De novo',
  HARD: 'Difícil',
  GOOD: 'Bom',
  EASY: 'Fácil',
};
const minutes = new Intl.NumberFormat('pt-BR', {
  style: 'unit',
  unit: 'minute',
  unitDisplay: 'short',
});
const days = new Intl.NumberFormat('pt-BR', {
  style: 'unit',
  unit: 'day',
  unitDisplay: 'long',
});
const intervalText = (seconds: number) =>
  seconds % 86400 === 0
    ? days.format(seconds / 86400)
    : minutes.format(seconds / 60);

export function ReviewQueue({
  deckId,
  subjectId,
  title = 'Revisão',
  onClose,
  onRated,
}: {
  deckId?: string | undefined;
  subjectId?: string | undefined;
  title?: string;
  onClose: () => void;
  onRated?: () => void;
}) {
  const [session, setSession] = useState<ScheduledCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [complete, setComplete] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [history, setHistory] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const answer = useRef<HTMLParagraphElement>(null);
  const historyButton = useRef<HTMLButtonElement>(null);
  const request = useRef<ReviewRequest | null>(null);
  const sending = useRef(false);
  const active = useRef(false);

  useEffect(() => {
    active.current = true;
    heading.current?.focus();
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (revealed) answer.current?.focus();
    else if (session || complete) heading.current?.focus();
  }, [session, revealed, complete]);

  useEffect(() => {
    let current = true;
    const scope: ReviewScope | undefined = deckId
      ? { deckId }
      : subjectId
        ? { subjectId }
        : undefined;
    async function load() {
      setLoading(true);
      setError('');
      setConflict(false);
      setSession(null);
      setComplete(false);
      setRevealed(false);
      setHistory(false);
      request.current = null;
      try {
        const { items } = await pendingReviews(1, scope, 1);
        if (!current) return;
        const next = items[0];
        if (!next) {
          setComplete(true);
          return;
        }
        const card = await scheduledCard(next.deckId, next.id, subjectId);
        if (!current) return;
        if (!card.intervals) throw new Error('Missing review intervals');
        if (card.state.revision !== next.revision) {
          setConflict(true);
          setError(
            'O cartão foi atualizado. Recarregue a fila para continuar.',
          );
          return;
        }
        setSession(card);
      } catch {
        if (current) setError('Não foi possível carregar o próximo cartão.');
      } finally {
        if (current) setLoading(false);
      }
    }
    void load();
    return () => {
      current = false;
    };
  }, [deckId, subjectId, attempt]);

  async function rate(rating: ReviewRating) {
    if (!session || !revealed || conflict || sending.current) return;
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
      const result = await rateCard(
        session.card.deckId,
        session.card.id,
        payload,
      );
      if (!active.current) return;
      setNotice(
        `Avaliação registrada. Próxima revisão: ${new Date(result.dueAt).toLocaleString()}.`,
      );
      setLoading(true);
      onRated?.();
      setAttempt((value) => value + 1);
    } catch (cause) {
      if (!active.current) return;
      if (cause instanceof AuthApiError && cause.status === 409) {
        setConflict(true);
        setError(
          'O cartão foi atualizado ou ainda não está pendente. Recarregue a fila.',
        );
      } else {
        setError(
          'Não foi possível confirmar. Tente novamente com a mesma avaliação.',
        );
      }
    } finally {
      sending.current = false;
      if (active.current) setBusy(false);
    }
  }

  return (
    <section className="review-queue" aria-label="Sessão de revisão">
      <header className="review-header">
        <Button variant="outline" disabled={busy} onClick={onClose}>
          Voltar ao resumo
        </Button>
        <h2 ref={heading} tabIndex={-1}>
          {title}
        </h2>
        {session && (
          <Button
            variant="ghost"
            ref={historyButton}
            disabled={busy}
            onClick={() => setHistory(true)}
          >
            Ver histórico
          </Button>
        )}
      </header>
      <p className="review-notice" role="status">
        {notice}
      </p>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {error}
            {(!session || conflict) && (
              <Button
                variant="outline"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Recarregar fila
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {loading && (
        <div role="status">
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          Carregando cartão…
        </div>
      )}
      {complete && (
        <p role="status">
          {notice ? 'Sessão concluída. ' : ''}Nenhuma revisão pendente agora.
        </p>
      )}
      {session && !loading && (
        <div className="review-stage">
          <div className="review-reading">
            <p className="flashcard-text">{session.card.front}</p>
            {revealed && (
              <div>
                <Separator className="my-4" />
                <p ref={answer} tabIndex={-1} className="flashcard-text">
                  <span className="sr-only">Resposta: </span>
                  {session.card.back}
                </p>
              </div>
            )}
          </div>
          <div className="review-controls">
            {!revealed ? (
              <Button onClick={() => setRevealed(true)}>
                Mostrar resposta
              </Button>
            ) : (
              session.intervals && (
                <div className="review-ratings">
                  {(Object.keys(ratings) as ReviewRating[]).map((rating) => (
                    <div key={rating}>
                      <span id={`interval-${rating}`}>
                        {intervalText(session.intervals![rating])}
                      </span>
                      <Button
                        className={`review-rating review-rating-${rating.toLowerCase()}`}
                        aria-describedby={`interval-${rating}`}
                        disabled={
                          busy ||
                          conflict ||
                          (!!request.current &&
                            request.current.rating !== rating)
                        }
                        onClick={() => void rate(rating)}
                      >
                        {ratings[rating]}
                      </Button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
      {session && history && (
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
  );
}
