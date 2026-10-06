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
import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import { Button } from '@study-platform/ui/components/ui/button';

import { useEffect, useRef, useState } from 'react';
import type {
  DeckList,
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
import { SubjectName } from '../subjects/SubjectName.js';
import { TaskConfirmation } from '../tasks/TaskConfirmation.js';
import '../../styles/flashcards.css';
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
    if (wasReviewing.current && !reviewing)
      document.getElementById('start-review')?.focus();
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
  }, [deckId]);
  useEffect(() => {
    let active = true;
    setDecks(null);
    setListError('');
    void listDecks(page)
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
  }, [page, revision]);
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
        setCardPage(1);
      }
    } catch {
      if (token === request.current)
        setError('Não foi possível abrir o baralho. Tente novamente.');
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
  return (
    <div className="flashcards-page">
      <p>Crie perguntas e respostas e consulte seus cartões manualmente.</p>
      <div className="flashcard-actions">
        {aiEnabled && (
          <Button
            id="start-flashcard-ai"
            disabled={generating}
            onClick={() => setGenerating(true)}
          >
            Aprimorar com IA
          </Button>
        )}
        <Button
          id="start-review"
          disabled={reviewing}
          onClick={() => setReviewing(true)}
        >
          Revisões pendentes
        </Button>
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
      </div>
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
      {reviewing && (
        <ReviewQueue deckId={deck?.id} onClose={() => setReviewing(false)} />
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
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando baralhos…</p>
        </div>
      ) : (
        <>
          {!decks.items.length && (
            <p>Nenhum baralho. Crie seu primeiro baralho.</p>
          )}
          <ul className="flashcard-list">
            {decks.items.map((item) => (
              <Card key={item.id} asChild>
                <li className="flashcard-panel">
                  <CardHeader>
                    <h2>{item.name}</h2>
                  </CardHeader>
                  <CardContent>
                    {subjectsEnabled && (
                      <p>
                        <SubjectName id={item.subjectId} />
                      </p>
                    )}
                    <p className="flashcard-text">{item.description}</p>
                    <div className="flashcard-actions">
                      <Button
                        disabled={busy}
                        onClick={() => void openDeck(item.id)}
                      >
                        Abrir {item.name}
                      </Button>
                      <Button
                        id={`edit-deck-${item.id}`}
                        disabled={busy}
                        onClick={() => {
                          setEditingDeck(item);
                          setDeckForm(true);
                        }}
                      >
                        Editar {item.name}
                      </Button>
                      <Button
                        id={`delete-deck-${item.id}`}
                        disabled={busy}
                        onClick={() =>
                          setConfirmation({
                            deck: item,
                            returnId: `delete-deck-${item.id}`,
                          })
                        }
                      >
                        Excluir {item.name}
                      </Button>
                    </div>
                  </CardContent>
                </li>
              </Card>
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={decks.totalPages}
            onPage={setPage}
            label="Baralhos"
          />
        </>
      )}
      {deck && (
        <section aria-label={`Cartões de ${deck.name}`}>
          <h2 tabIndex={-1} ref={heading}>
            {deck.name}: cartões
          </h2>
          <div className="flashcard-actions">
            <Button
              id="start-import"
              disabled={busy || importing}
              onClick={() => setImporting(true)}
            >
              Importar CSV ou TSV
            </Button>
            <Button
              id="new-card"
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
