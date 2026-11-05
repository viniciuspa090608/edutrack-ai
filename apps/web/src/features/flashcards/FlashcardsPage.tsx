import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationItem,
} from '@study-platform/ui/components/ui/pagination';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import { Button } from '@study-platform/ui/components/ui/button';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@study-platform/ui/components/ui/table';
import { useEffect, useRef, useState } from 'react';
import type {
  DeckList,
  PendingList,
  CardList,
  FlashcardDeck,
  Flashcard,
} from '@study-platform/contracts';
import {
  listDecks,
  listCards,
  deckDetail,
  cardDetail,
  deleteDeck,
  deleteCard,
} from './flashcards-api.js';
import { DeckForm, CardForm } from './FlashcardForms.js';
import { CardViewer } from './CardViewer.js';
import { ImportFlow } from './ImportFlow.js';
import { ReviewQueue } from './ReviewQueue.js';
import { ReviewHistory } from './ReviewHistory.js';
import { FlashcardAIFlow } from './FlashcardAIFlow.js';
import { pendingReviews } from './reviews-api.js';
import { SubjectSelect } from '../subjects/SubjectSelect.js';
import { subjectDetail } from '../subjects/subjects-api.js';
import { SubjectName } from '../subjects/SubjectName.js';
import { TaskConfirmation } from '../tasks/TaskConfirmation.js';
import '../../styles/flashcards.css';
const categories = [
  ['new', 'Novos'],
  ['learning', 'Em aprendizagem'],
  ['review', 'Para revisão'],
] as const;

function Pagination({
  page,
  totalPages,
  onPage,
  label,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  label: string;
}) {
  return (
    <PaginationRoot aria-label={label}>
      <PaginationContent className="flex-wrap">
        <PaginationItem>
          <Button
            aria-label="Anterior"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
        </PaginationItem>
        <PaginationItem>
          <span>
            Página {page} de {Math.max(1, totalPages)}
          </span>
        </PaginationItem>
        <PaginationItem>
          <Button
            aria-label="Próxima"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
export function FlashcardsPage({
  subjectsEnabled,
  aiEnabled = false,
}: {
  subjectsEnabled: boolean;
  aiEnabled?: boolean;
}) {
  const [decks, setDecks] = useState<DeckList | null>(null);
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<CardList | null>(null);
  const [page, setPage] = useState(1);
  const [cardPage, setCardPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [listError, setListError] = useState('');
  const [cardsError, setCardsError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [deckForm, setDeckForm] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [cardForm, setCardForm] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [viewing, setViewing] = useState<Flashcard | null>(null);
  const [importing, setImporting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjectStudy, setSubjectStudy] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [overview, setOverview] = useState<PendingList | null>(null);
  const [overviewError, setOverviewError] = useState(false);
  const filter = subjectsEnabled ? subjectFilter : '';
  const studySubject = subjectsEnabled ? subjectStudy : null;
  const title = deck?.name ?? studySubject?.name;
  const studySubjectId = studySubject?.id;
  const [generating, setGenerating] = useState(false);
  const [historyCard, setHistoryCard] = useState<{
    deckId: string;
    cardId: string;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<{
    cardId?: string;
    deck: FlashcardDeck;
    returnId: string;
  } | null>(null);
  const request = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const wasImporting = useRef(false);
  const wasReviewing = useRef(false);
  useEffect(() => {
    if (wasReviewing.current && !reviewing) heading.current?.focus();
    wasReviewing.current = reviewing;
  }, [reviewing]);
  useEffect(() => {
    if (wasImporting.current && !importing)
      document.getElementById('start-import')?.focus();
    wasImporting.current = importing;
  }, [importing]);
  const deckId = deck?.id;
  useEffect(() => {
    heading.current?.focus();
  }, [deckId, studySubjectId]);
  useEffect(() => {
    let active = true;
    setOverview(null);
    setOverviewError(false);
    const scope = deckId
      ? { deckId }
      : studySubjectId
        ? { subjectId: studySubjectId }
        : undefined;
    if (scope)
      void pendingReviews(1, scope, 1)
        .then((result) => {
          if (active) setOverview(result);
        })
        .catch(() => {
          if (active) setOverviewError(true);
        });
    return () => {
      active = false;
    };
  }, [deckId, studySubjectId, revision]);
  useEffect(() => {
    let active = true;
    setDecks(null);
    setListError('');
    void listDecks(page, filter || undefined)
      .then((result) => {
        if (!active) return;
        if (page > 1 && !result.items.length) {
          setPage(Math.max(1, result.totalPages));
          return;
        }
        setDecks(result);
      })
      .catch(() => {
        if (active) setListError('Não foi possível carregar baralhos.');
      });
    return () => {
      active = false;
    };
  }, [page, revision, filter]);
  useEffect(() => {
    let active = true;
    setCards(null);
    setCardsError('');
    if (deckId)
      void listCards(deckId, cardPage)
        .then((result) => {
          if (!active) return;
          if (cardPage > 1 && !result.items.length) {
            setCardPage(Math.max(1, result.totalPages));
            return;
          }
          setCards(result);
        })
        .catch(() => {
          if (active) setCardsError('Não foi possível carregar cartões.');
        });
    return () => {
      active = false;
    };
  }, [deckId, cardPage, revision]);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  async function openDeck(id: string) {
    const token = ++request.current;
    setBusy(true);
    setError('');
    setViewing(null);
    setImporting(false);
    setCardForm(false);
    try {
      const result = await deckDetail(id);
      if (token === request.current) {
        setDeck(result);
        setSubjectStudy(null);
        setCardPage(1);
      }
    } catch {
      if (token === request.current)
        setError('Não foi possível abrir o baralho. Tente novamente.');
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  async function openSubject(id: string) {
    const token = ++request.current;
    setBusy(true);
    setError('');
    try {
      const subject = await subjectDetail(id);
      if (token === request.current) setSubjectStudy(subject);
    } catch {
      if (token === request.current)
        setError('Não foi possível abrir a matéria.');
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  async function openCard(id: string, edit: boolean) {
    if (!deck) return;
    const token = ++request.current;
    setBusy(true);
    setError('');
    setViewing(null);
    setCardForm(false);
    try {
      const result = await cardDetail(deck.id, id);
      if (token === request.current) {
        if (edit) {
          setEditingCard(result);
          setCardForm(true);
        } else setViewing(result);
      }
    } catch {
      if (token === request.current)
        setError('Não foi possível abrir o cartão. Tente novamente.');
    } finally {
      if (token === request.current) setBusy(false);
    }
  }
  const refresh = (message: string) => {
    setRevision((value) => value + 1);
    setSuccess(message);
    setError('');
  };
  if (reviewing && title)
    return (
      <div className="flashcards-page">
        <ReviewQueue
          deckId={deckId}
          subjectId={studySubjectId}
          title={title}
          onClose={() => setReviewing(false)}
          onRated={() => setRevision((value) => value + 1)}
        />
      </div>
    );
  return (
    <div className="flashcards-page">
      {title ? (
        <>
          <Button
            variant="outline"
            className="justify-self-start"
            onClick={() => {
              request.current++;
              setBusy(false);
              setDeck(null);
              setSubjectStudy(null);
              setViewing(null);
              setCardForm(false);
              setImporting(false);
              setError('');
            }}
          >
            Voltar a Baralhos
          </Button>
          <section className="study-overview">
            <h2 ref={heading} tabIndex={-1}>
              {title}
            </h2>
            {subjectsEnabled && deck?.subjectId && (
              <SubjectName id={deck.subjectId} />
            )}
            {deck?.description && (
              <p className="flashcard-text">{deck.description}</p>
            )}
            {overviewError ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>
                  Não foi possível carregar a fila.{' '}
                  <Button onClick={() => setRevision(revision + 1)}>
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            ) : overview ? (
              <div className="study-summary">
                <dl className="study-counts">
                  {categories.map(([key, label]) => (
                    <div key={key} className={`queue-count-${key}`}>
                      <dt>{label}</dt>
                      <dd>{overview.counts?.[key] ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
                {overview.total ? (
                  <Button onClick={() => setReviewing(true)}>
                    Estudar agora
                  </Button>
                ) : (
                  <p role="status">
                    Nenhum cartão disponível para estudar agora.
                  </p>
                )}
              </div>
            ) : (
              <p role="status">Carregando fila de estudo…</p>
            )}
          </section>
        </>
      ) : null}
      {(!title || aiEnabled) && (
        <div className="deck-toolbar">
          {!title && (
            <h2 ref={heading} tabIndex={-1}>
              Baralhos
            </h2>
          )}
          <div className="flashcard-actions">
            {aiEnabled && (
              <Button
                variant="outline"
                id="start-flashcard-ai"
                disabled={generating}
                onClick={() => setGenerating(true)}
              >
                Aprimorar com IA
              </Button>
            )}
            {!title && (
              <Button
                id="new-deck"
                disabled={busy}
                onClick={() => {
                  setEditingDeck(null);
                  setDeckForm(true);
                }}
              >
                Criar baralho
              </Button>
            )}
          </div>
        </div>
      )}
      {aiEnabled && generating && (
        <FlashcardAIFlow
          initialDeck={deck}
          onClose={() => {
            setGenerating(false);
            requestAnimationFrame(() =>
              document.getElementById('start-flashcard-ai')?.focus(),
            );
          }}
          onSaved={() => refresh('Cartões gerados salvos.')}
        />
      )}
      {historyCard && (
        <ReviewHistory
          key={historyCard.cardId}
          deckId={historyCard.deckId}
          cardId={historyCard.cardId}
          onClose={() => {
            const id = historyCard.cardId;
            setHistoryCard(null);
            requestAnimationFrame(() =>
              document.getElementById(`history-card-${id}`)?.focus(),
            );
          }}
        />
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && <p role="status">{success}</p>}
      {busy && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando detalhe…</p>
        </div>
      )}
      {deckForm && (
        <DeckForm
          key={editingDeck?.id ?? 'new'}
          deck={editingDeck}
          subjectsEnabled={subjectsEnabled}
          onCancel={() => {
            setDeckForm(false);
            document
              .getElementById(
                editingDeck ? `edit-deck-${editingDeck.id}` : 'new-deck',
              )
              ?.focus();
          }}
          onSaved={(result) => {
            setDeckForm(false);
            setDeck(result);
            setCardPage(1);
            refresh('Baralho salvo.');
          }}
        />
      )}
      {!title && subjectsEnabled && (
        <div className="deck-filter">
          <SubjectSelect
            value={filter}
            label="Matéria"
            emptyLabel="Todas as matérias"
            disabled={busy}
            onChange={(value) => {
              setSubjectFilter(value);
              setPage(1);
            }}
          />
          {filter && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void openSubject(filter)}
            >
              Ver estudo desta matéria
            </Button>
          )}
        </div>
      )}
      {!deck && (
        <section
          aria-label={
            studySubject ? 'Baralhos vinculados' : 'Lista de baralhos'
          }
        >
          {studySubject && <h3>Baralhos vinculados</h3>}
          {listError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {listError}{' '}
                <Button onClick={() => setRevision(revision + 1)}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : !decks ? (
            <div role="status">
              <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
              Carregando baralhos…
            </div>
          ) : !decks.items.length ? (
            <p>
              {filter
                ? 'Nenhum baralho vinculado a esta matéria.'
                : 'Nenhum baralho. Crie seu primeiro baralho.'}
            </p>
          ) : (
            <>
              <Table
                className="deck-table"
                aria-label="Baralhos e contagens de estudo"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Baralho</TableHead>
                    {categories.map(([key, label]) => (
                      <TableHead scope="col" key={key}>
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {decks.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="deck-name">
                          <Button
                            variant="link"
                            disabled={busy}
                            onClick={() => void openDeck(item.id)}
                          >
                            {item.name}
                          </Button>
                          {subjectsEnabled && item.subjectId && (
                            <SubjectName id={item.subjectId} />
                          )}
                        </div>
                      </TableCell>
                      {categories.map(([key, label]) => (
                        <TableCell
                          key={key}
                          className={`queue-count queue-count-${key}`}
                        >
                          <span
                            className="deck-mobile-label"
                            aria-hidden="true"
                          >
                            {label}
                          </span>
                          {item.counts?.[key] ?? '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={decks.totalPages}
                onPage={setPage}
                label="Baralhos"
              />
            </>
          )}
        </section>
      )}
      {deck && (
        <section aria-label={`Cartões de ${deck.name}`}>
          <h3>Gerenciar baralho e cartões</h3>
          <div className="flashcard-actions">
            <Button
              id={`edit-deck-${deck.id}`}
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditingDeck(deck);
                setDeckForm(true);
              }}
            >
              Editar {deck.name}
            </Button>
            <Button
              id={`delete-deck-${deck.id}`}
              variant="outline"
              disabled={busy}
              onClick={() =>
                setConfirmation({ deck, returnId: `delete-deck-${deck.id}` })
              }
            >
              Excluir {deck.name}
            </Button>
            <Button
              id="start-import"
              variant="outline"
              disabled={busy || importing}
              onClick={() => setImporting(true)}
            >
              Importar CSV ou TSV
            </Button>
            <Button
              id="new-card"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setViewing(null);
                setEditingCard(null);
                setCardForm(true);
              }}
            >
              Adicionar cartão
            </Button>
          </div>
          {importing && (
            <ImportFlow
              key={deck.id}
              deckId={deck.id}
              onClose={() => {
                setImporting(false);
                document.getElementById('start-import')?.focus();
              }}
              onImported={() => refresh('Cartões importados.')}
            />
          )}
          {cardForm && (
            <CardForm
              key={editingCard?.id ?? 'new'}
              deckId={deck.id}
              card={editingCard}
              onCancel={() => {
                setCardForm(false);
                document.getElementById('new-card')?.focus();
              }}
              onSaved={() => {
                setCardForm(false);
                setViewing(null);
                refresh('Cartão salvo.');
              }}
            />
          )}
          {viewing && (
            <CardViewer
              key={viewing.id}
              card={viewing}
              onClose={() => {
                const id = viewing.id;
                setViewing(null);
                document.getElementById(`open-card-${id}`)?.focus();
              }}
            />
          )}
          {cardsError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {cardsError}{' '}
                <Button onClick={() => setRevision(revision + 1)}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          ) : !cards ? (
            <div>
              <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
              <p role="status">Carregando cartões…</p>
            </div>
          ) : (
            <>
              {!cards.items.length && (
                <p>Este baralho está vazio. Adicione seu primeiro cartão.</p>
              )}
              <ul className="flashcard-list">
                {cards.items.map((item) => (
                  <Card key={item.id} asChild>
                    <li className="flashcard-panel">
                      <CardContent>
                        <p className="flashcard-text">{item.front}</p>
                        <div className="flashcard-actions">
                          <Button
                            id={`open-card-${item.id}`}
                            disabled={busy}
                            onClick={() => void openCard(item.id, false)}
                          >
                            Abrir cartão
                          </Button>
                          <Button
                            id={`history-card-${item.id}`}
                            onClick={() =>
                              setHistoryCard({
                                deckId: deck.id,
                                cardId: item.id,
                              })
                            }
                          >
                            Histórico do cartão
                          </Button>
                          <Button
                            disabled={busy}
                            onClick={() => void openCard(item.id, true)}
                          >
                            Editar cartão
                          </Button>
                          <Button
                            id={`delete-card-${item.id}`}
                            disabled={busy}
                            onClick={() =>
                              setConfirmation({
                                deck,
                                cardId: item.id,
                                returnId: `delete-card-${item.id}`,
                              })
                            }
                          >
                            Excluir cartão
                          </Button>
                        </div>
                      </CardContent>
                    </li>
                  </Card>
                ))}
              </ul>
              <Pagination
                page={cardPage}
                totalPages={cards.totalPages}
                onPage={(value) => {
                  setViewing(null);
                  setCardPage(value);
                }}
                label="Cartões"
              />
            </>
          )}
        </section>
      )}
      {confirmation && (
        <TaskConfirmation
          title={
            confirmation.cardId
              ? 'Excluir cartão?'
              : `Excluir ${confirmation.deck.name}?`
          }
          description={
            confirmation.cardId
              ? 'Somente este cartão será removido.'
              : 'O baralho e todos os seus cartões serão removidos.'
          }
          action="Confirmar exclusão"
          returnFocusId={confirmation.returnId}
          onCancel={() => setConfirmation(null)}
          onConfirm={async () => {
            try {
              if (confirmation.cardId) {
                await deleteCard(confirmation.deck.id, confirmation.cardId);
                if (viewing?.id === confirmation.cardId) setViewing(null);
                setCardForm(false);
              } else {
                await deleteDeck(confirmation.deck.id);
                if (deck?.id === confirmation.deck.id) {
                  setDeck(null);
                  setViewing(null);
                  setCardForm(false);
                }
                if (editingDeck?.id === confirmation.deck.id)
                  setDeckForm(false);
              }
            } catch {
              throw new Error(
                'Não foi possível excluir. Os dados foram preservados. Tente novamente.',
              );
            }
            setConfirmation(null);
            refresh('Exclusão concluída.');
            document.getElementById('new-deck')?.focus();
          }}
        />
      )}
    </div>
  );
}
