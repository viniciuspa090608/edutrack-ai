import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import { FieldSet } from '@study-platform/ui/components/ui/field';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';

import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';

import { Textarea } from '@study-platform/ui/components/ui/textarea';
import { Button } from '@study-platform/ui/components/ui/button';
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
    <Card asChild>
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
        <CardHeader>
          <h2>{deck ? 'Editar baralho' : 'Criar baralho'}</h2>
        </CardHeader>
        <CardContent>
          <FieldSet disabled={busy}>
            <Label htmlFor="deck-name">Nome</Label>
            <Input
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
              <Alert variant="destructive" role="alert" id="deck-name-error">
                <AlertDescription>{errors.name}</AlertDescription>
              </Alert>
            )}
            <Label htmlFor="deck-description">Descrição (opcional)</Label>
            <Textarea
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
              <Alert
                variant="destructive"
                role="alert"
                id="deck-description-error"
              >
                <AlertDescription>{errors.description}</AlertDescription>
              </Alert>
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
                <Button type="button" onClick={() => setSubjectId('')}>
                  Remover vínculo com matéria
                </Button>
                {!subjectId && <span> Vínculo será removido ao salvar.</span>}
              </p>
            )}
            <div className="flashcard-actions">
              <Button type="submit">
                {busy ? 'Salvando…' : 'Salvar baralho'}
              </Button>
              <Button type="button" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </FieldSet>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </form>
    </Card>
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
    <Card asChild>
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
        <CardHeader>
          <h3>{card ? 'Editar cartão' : 'Adicionar cartão'}</h3>
        </CardHeader>
        <CardContent>
          <FieldSet disabled={busy}>
            {(['front', 'back'] as const).map((field) => (
              <div key={field}>
                <Label htmlFor={`card-${field}`}>
                  {field === 'front' ? 'Frente' : 'Verso'}
                </Label>
                <Textarea
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
                  <Alert
                    variant="destructive"
                    role="alert"
                    id={`card-${field}-error`}
                  >
                    <AlertDescription>{errors[field]}</AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
            <div className="flashcard-actions">
              <Button type="submit">
                {busy ? 'Salvando…' : 'Salvar cartão'}
              </Button>
              <Button type="button" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </FieldSet>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </form>
    </Card>
  );
}
