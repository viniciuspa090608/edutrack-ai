import { useRef, useState } from 'react';
import { createDeckSchema, createCardSchema } from '@study-platform/contracts';
import type { FlashcardDeck, Flashcard } from '@study-platform/contracts';
import { SubjectSelect } from '../subjects/SubjectSelect.js';
import { saveDeck, saveCard } from './flashcards-api.js';
export function DeckForm({
  deck,
  subjectsEnabled,
  onSaved,
  onCancel,
}: {
  deck: FlashcardDeck | null;
  subjectsEnabled: boolean;
  onSaved: (deck: FlashcardDeck) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(deck?.name ?? '');
  const [description, setDescription] = useState(deck?.description ?? '');
  const [subjectId, setSubjectId] = useState(deck?.subjectId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  return (
    <form
      className="flashcard-panel"
      aria-label={deck ? 'Editar baralho' : 'Criar baralho'}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting.current) return;
        const result = createDeckSchema.safeParse({
          name,
          description: description || null,
          subjectId: subjectId || null,
        });
        const fields: Record<string, string> = {};
        if (!result.success) {
          for (const issue of result.error.issues)
            fields[String(issue.path[0])] =
              'Verifique este campo e o limite de caracteres.';
          setErrors(fields);
          document.getElementById(`deck-${Object.keys(fields)[0]}`)?.focus();
          return;
        }
        setErrors({});
        setError('');
        setBusy(true);
        submitting.current = true;
        try {
          const { subjectId: selected, ...values } = result.data;
          onSaved(
            await saveDeck(
              deck?.id ?? null,
              subjectsEnabled || !deck || !selected
                ? { ...values, subjectId: selected }
                : values,
            ),
          );
        } catch {
          setError('Não foi possível salvar o baralho. Tente novamente.');
        } finally {
          setBusy(false);
          submitting.current = false;
        }
      }}
    >
      <h2>{deck ? 'Editar baralho' : 'Criar baralho'}</h2>
      <fieldset disabled={busy}>
        <label htmlFor="deck-name">Nome</label>
        <input
          autoFocus
          id="deck-name"
          value={name}
          maxLength={120}
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'deck-name-error' : undefined}
          onChange={(event) => setName(event.target.value)}
        />
        {errors.name && (
          <p role="alert" id="deck-name-error">
            {errors.name}
          </p>
        )}
        <label htmlFor="deck-description">Descrição (opcional)</label>
        <textarea
          id="deck-description"
          value={description}
          maxLength={1000}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? 'deck-description-error' : undefined
          }
          onChange={(event) => setDescription(event.target.value)}
        />
        {errors.description && (
          <p role="alert" id="deck-description-error">
            {errors.description}
          </p>
        )}
        {subjectsEnabled && (
          <SubjectSelect
            value={subjectId}
            onChange={setSubjectId}
            disabled={busy}
          />
        )}
        {!subjectsEnabled && deck?.subjectId && (
          <p>
            O vínculo existente será preservado.{' '}
            <button type="button" onClick={() => setSubjectId('')}>
              Remover vínculo com matéria
            </button>
            {!subjectId && <span> Vínculo será removido ao salvar.</span>}
          </p>
        )}
        <div className="flashcard-actions">
          <button type="submit">{busy ? 'Salvando…' : 'Salvar baralho'}</button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
export function CardForm({
  deckId,
  card,
  onSaved,
  onCancel,
}: {
  deckId: string;
  card: Flashcard | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [front, setFront] = useState(card?.front ?? '');
  const [back, setBack] = useState(card?.back ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  return (
    <form
      className="flashcard-panel"
      aria-label={card ? 'Editar cartão' : 'Adicionar cartão'}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting.current) return;
        const result = createCardSchema.safeParse({ front, back });
        if (!result.success) {
          const fields: Record<string, string> = {};
          for (const issue of result.error.issues)
            fields[String(issue.path[0])] =
              'Preencha o texto dentro do limite de caracteres.';
          setErrors(fields);
          document.getElementById(`card-${Object.keys(fields)[0]}`)?.focus();
          return;
        }
        setErrors({});
        setError('');
        setBusy(true);
        submitting.current = true;
        try {
          await saveCard(deckId, card?.id ?? null, result.data);
          onSaved();
        } catch {
          setError('Não foi possível salvar o cartão. Tente novamente.');
        } finally {
          setBusy(false);
          submitting.current = false;
        }
      }}
    >
      <h3>{card ? 'Editar cartão' : 'Adicionar cartão'}</h3>
      <fieldset disabled={busy}>
        {(['front', 'back'] as const).map((field) => (
          <div key={field}>
            <label htmlFor={`card-${field}`}>
              {field === 'front' ? 'Frente' : 'Verso'}
            </label>
            <textarea
              autoFocus={field === 'front'}
              id={`card-${field}`}
              required
              maxLength={field === 'front' ? 2000 : 4000}
              value={field === 'front' ? front : back}
              onChange={(event) =>
                (field === 'front' ? setFront : setBack)(event.target.value)
              }
              aria-invalid={!!errors[field]}
              aria-describedby={
                errors[field] ? `card-${field}-error` : undefined
              }
            />
            {errors[field] && (
              <p role="alert" id={`card-${field}-error`}>
                {errors[field]}
              </p>
            )}
          </div>
        ))}
        <div className="flashcard-actions">
          <button type="submit">{busy ? 'Salvando…' : 'Salvar cartão'}</button>
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
