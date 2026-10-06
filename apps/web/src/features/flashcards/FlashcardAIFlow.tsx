import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { FieldSet, FieldLegend } from '@study-platform/ui/components/ui/field';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@study-platform/ui/components/ui/pagination';

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import { Textarea } from '@study-platform/ui/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';
import { useEffect, useRef, useState } from 'react';
import {
  flashcardGenerationSchema,
  generatedCardsSchema,
} from '@study-platform/contracts';
import type {
  DeckList,
  FlashcardDeck,
  FlashcardPreview,
  GeneratedCard,
  ConfirmFlashcardGeneration,
  FlashcardAIResult,
} from '@study-platform/contracts';
import { listDecks } from './flashcards-api.js';
import { generateFlashcards, confirmFlashcards } from './flashcard-ai-api.js';
import { AuthApiError } from '../auth/auth-api.js';
function message(cause: unknown) {
  if (cause instanceof AuthApiError) {
    if (cause.code === 'RECEIPT_EXPIRED' || cause.code === 'INVALID_RECEIPT')
      return 'Esta prévia expirou ou não é válida. Gere outra prévia.';
    if (cause.status === 403)
      return 'IA ou flashcards foram desativados. Reative-os nas preferências para continuar.';
    if (cause.status === 404)
      return 'O baralho não está mais disponível. Escolha outro destino.';
    if (cause.code === 'AI_INVALID_RESPONSE')
      return 'A IA retornou cartões inválidos. Tente gerar novamente.';
    if (cause.code === 'AI_TIMEOUT')
      return 'A IA demorou para responder. Tente novamente.';
    if (cause.code === 'AI_UNAVAILABLE')
      return 'A geração por IA está indisponível. Tente novamente mais tarde.';
  }
  return 'Não foi possível concluir. Suas edições foram preservadas. Tente novamente.';
}
export function FlashcardAIFlow({
  initialDeck,
  onClose,
  onSaved,
}: {
  initialDeck: FlashcardDeck | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [decks, setDecks] = useState<DeckList | null>(null),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [deckError, setDeckError] = useState(false);
  const [deckId, setDeckId] = useState(initialDeck?.id ?? ''),
    [text, setText] = useState('');
  const [preview, setPreview] = useState<FlashcardPreview | null>(null),
    [cards, setCards] = useState<GeneratedCard[]>([]),
    [result, setResult] = useState<FlashcardAIResult | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [inputError, setInputError] = useState(''),
    [invalidCards, setInvalidCards] = useState(false),
    [uncertain, setUncertain] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null),
    source = useRef<HTMLTextAreaElement>(null),
    sending = useRef(false),
    active = useRef(true),
    pending = useRef<ConfirmFlashcardGeneration | null>(null);
  useEffect(() => {
    heading.current?.focus();
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [preview, result]);
  useEffect(() => {
    let current = true;
    setDecks(null);
    setDeckError(false);
    void listDecks(page)
      .then((value) => {
        if (current) setDecks(value);
      })
      .catch(() => {
        if (current) setDeckError(true);
      });
    return () => {
      current = false;
    };
  }, [page, retry]);
  async function generate() {
    if (sending.current) return;
    setError('');
    setInputError('');
    if (!deckId) {
      setInputError('Escolha um baralho existente.');
      return;
    }
    const parsed = flashcardGenerationSchema.safeParse({ text });
    if (!parsed.success) {
      setInputError('Informe conteúdo ou assunto de 1 a 10.000 caracteres.');
      source.current?.focus();
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const value = await generateFlashcards(deckId, parsed.data.text);
      if (active.current) {
        setPreview(value);
        setCards(value.cards);
        setInvalidCards(false);
        setUncertain(false);
        pending.current = null;
      }
    } catch (cause) {
      if (active.current) setError(message(cause));
    } finally {
      sending.current = false;
      if (active.current) setBusy(false);
    }
  }
  async function save() {
    if (!preview || sending.current) return;
    setError('');
    const parsed = generatedCardsSchema.safeParse(cards);
    if (!parsed.success) {
      setInvalidCards(true);
      return;
    }
    pending.current ??= {
      deckId: preview.deckId,
      receipt: preview.receipt,
      cards: parsed.data,
    };
    sending.current = true;
    setBusy(true);
    try {
      const value = await confirmFlashcards(pending.current);
      if (active.current) {
        setResult(value);
        setUncertain(false);
        onSaved();
      }
    } catch (cause) {
      if (active.current) {
        setError(message(cause));
        if (cause instanceof AuthApiError && cause.status < 500) {
          pending.current = null;
          setUncertain(false);
        } else setUncertain(true);
      }
    } finally {
      sending.current = false;
      if (active.current) setBusy(false);
    }
  }
  const options = decks?.items ?? [];
  return (
    <Card asChild>
      <section
        className="flashcard-panel flashcard-ai-flow"
        aria-label="Aprimorar com IA"
      >
        <CardHeader>
          <h2 ref={heading} tabIndex={-1}>
            Aprimorar com IA
          </h2>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {error.includes('preferências') && (
            <a href="/app/profile">Abrir preferências</a>
          )}
          {busy && (
            <div>
              <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
              <p role="status">Processando cartões…</p>
            </div>
          )}
          {result ? (
            <>
              <p role="status">
                {result.cards.length} cartões salvos no baralho.
              </p>
              <ol>
                {result.cards.map((card) => (
                  <li key={card.id}>
                    <p className="flashcard-text">{card.front}</p>
                    <p className="flashcard-text">{card.back}</p>
                  </li>
                ))}
              </ol>
              <Button onClick={onClose}>Fechar resultado</Button>
            </>
          ) : preview ? (
            <>
              <p>Destino: {preview.deckName}</p>
              <p className="flashcard-text">Entrada: {preview.text}</p>
              <p>
                Confira a precisão das perguntas e respostas antes de salvar.
              </p>
              <p>
                Prévia válida até {new Date(preview.expiresAt).toLocaleString()}
                .
              </p>
              {invalidCards && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>
                    Revise os campos indicados. Mantenha pelo menos um cartão
                    válido.
                  </AlertDescription>
                </Alert>
              )}
              {uncertain && (
                <p>
                  Confirmação sem resposta. Tente salvar novamente para
                  recuperar o mesmo resultado.
                </p>
              )}
              <ol>
                {cards.map((card, index) => (
                  <li key={card.id}>
                    <FieldSet disabled={busy || uncertain}>
                      <FieldLegend>Cartão {index + 1}</FieldLegend>
                      {(['front', 'back'] as const).map((side) => {
                        const label = side === 'front' ? 'Frente' : 'Verso',
                          limit = side === 'front' ? 2000 : 4000;
                        const invalid =
                          invalidCards &&
                          (!card[side].trim() ||
                            card[side].trim().length > limit);
                        return (
                          <Label key={side}>
                            {label} do cartão {index + 1}
                            <Textarea
                              aria-label={`${label} do cartão ${index + 1}`}
                              value={card[side]}
                              maxLength={limit}
                              aria-invalid={invalid}
                              aria-describedby={
                                invalid ? `${side}-${card.id}-error` : undefined
                              }
                              onChange={(e) =>
                                setCards((values) =>
                                  values.map((value) =>
                                    value.id === card.id
                                      ? { ...value, [side]: e.target.value }
                                      : value,
                                  ),
                                )
                              }
                            />
                            {invalid && (
                              <span id={`${side}-${card.id}-error`}>
                                Preencha {label.toLowerCase()} de até {limit}{' '}
                                caracteres.
                              </span>
                            )}
                          </Label>
                        );
                      })}
                      <Button
                        onClick={() => {
                          setCards((values) =>
                            values.filter((value) => value.id !== card.id),
                          );
                          heading.current?.focus();
                        }}
                      >
                        Remover cartão {index + 1}
                      </Button>
                    </FieldSet>
                  </li>
                ))}
              </ol>
              {!cards.length && (
                <p>Nenhum cartão restante. Gere outra prévia ou cancele.</p>
              )}
              <Button
                disabled={busy || !cards.length}
                onClick={() => void save()}
              >
                Salvar cartões
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  setPreview(null);
                  setCards([]);
                  setError('');
                  setUncertain(false);
                  pending.current = null;
                }}
              >
                Gerar outra prévia
              </Button>
              <Button disabled={busy} onClick={onClose}>
                Cancelar
              </Button>
            </>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void generate();
              }}
            >
              <FieldSet disabled={busy}>
                <FieldLegend>Origem e destino dos cartões</FieldLegend>
                {deckError ? (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>
                      Não foi possível carregar baralhos.{' '}
                      <Button type="button" onClick={() => setRetry(retry + 1)}>
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
                    {!decks.total && (
                      <p>Crie um baralho antes de gerar cartões.</p>
                    )}
                    <Label>
                      Baralho de destino
                      <NativeSelect
                        value={deckId}
                        onChange={(e) => setDeckId(e.target.value)}
                      >
                        <NativeSelectOption value="">
                          Escolha um baralho
                        </NativeSelectOption>
                        {initialDeck &&
                          !options.some(
                            (deck) => deck.id === initialDeck.id,
                          ) && (
                            <NativeSelectOption value={initialDeck.id}>
                              {initialDeck.name}
                            </NativeSelectOption>
                          )}
                        {options.map((deck) => (
                          <NativeSelectOption key={deck.id} value={deck.id}>
                            {deck.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Label>
                    <Pagination aria-label="Páginas de baralhos para IA">
                      <PaginationContent className="flex-wrap">
                        <PaginationItem>
                          <Button
                            aria-label="Anterior"
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                          >
                            <ChevronLeft aria-hidden="true" />
                          </Button>
                        </PaginationItem>
                        <PaginationItem>
                          <span>
                            Página {page} de {Math.max(1, decks.totalPages)}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <Button
                            aria-label="Próxima"
                            type="button"
                            disabled={page >= decks.totalPages}
                            onClick={() => setPage(page + 1)}
                          >
                            <ChevronRight aria-hidden="true" />
                          </Button>
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </>
                )}
                <Label>
                  Conteúdo ou assunto
                  <Textarea
                    ref={source}
                    value={text}
                    maxLength={10000}
                    aria-invalid={!!inputError}
                    aria-describedby={inputError ? 'ai-input-error' : undefined}
                    onChange={(e) => setText(e.target.value)}
                  />
                </Label>
                {inputError && (
                  <Alert variant="destructive" id="ai-input-error" role="alert">
                    <AlertDescription>{inputError}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={!decks || !decks.total}>
                  Gerar prévia
                </Button>
                <Button type="button" onClick={onClose}>
                  Cancelar
                </Button>
              </FieldSet>
            </form>
          )}
        </CardContent>
      </section>
    </Card>
  );
}
