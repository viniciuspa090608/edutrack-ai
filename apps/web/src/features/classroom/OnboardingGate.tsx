import { useState, useRef, useEffect, type ReactNode } from 'react';
import { onboardingStateSchema } from '@study-platform/contracts';
import type { ModulePreferences } from '@study-platform/contracts';
import { Button } from '@study-platform/ui/components/ui/button';
import { Checkbox } from '@study-platform/ui/components/ui/checkbox';
import { Label } from '@study-platform/ui/components/ui/label';
import { updatePreferences } from '../profile/profile-api.js';
import { classroomRequest as request } from './classroom-api.js';
import { ClassroomSection } from './ClassroomSection.js';

export function OnboardingGate({
  initialStep,
  prefs,
  onPreferences,
  children,
}: {
  initialStep: 'modules' | 'classroom' | 'completed' | undefined;
  prefs: ModulePreferences | null;
  onPreferences: (prefs: ModulePreferences) => void;
  children: ReactNode;
}) {
  const [step, setStep] = useState(initialStep ?? 'completed'),
    [draft, setDraft] = useState<ModulePreferences>({
      tasks: true,
      subjects: true,
      flashcards: true,
      ai: false,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(() => {
    if (prefs) setDraft(prefs);
  }, [prefs]);
  async function advance(next: 'classroom' | 'completed') {
    setBusy(true);
    setError('');
    try {
      if (step === 'modules') {
        const confirmed = await updatePreferences(draft);
        onPreferences(confirmed);
      }
      const state = onboardingStateSchema.parse(
        await request('/profile/onboarding', 'PATCH', { step: next }),
      );
      setStep(state.step);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível salvar. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (step === 'completed') return children;
  return (
    <section className="classroom-section" aria-labelledby="onboarding-title">
      <h1 id="onboarding-title" ref={heading} tabIndex={-1}>
        {step === 'modules'
          ? 'Escolha seus módulos'
          : 'Conecte suas turmas, se desejar'}
      </h1>
      {error && <p role="alert">{error}</p>}
      {step === 'modules' ? (
        <>
          <p>
            Mantenha pelo menos um módulo de estudo. IA é opcional e não inicia
            geração automaticamente.
          </p>
          {(['tasks', 'subjects', 'flashcards', 'ai'] as const).map((key) => (
            <Label key={key}>
              <Checkbox
                checked={draft[key]}
                disabled={busy}
                onCheckedChange={(checked) =>
                  setDraft({ ...draft, [key]: checked === true })
                }
              />
              {
                {
                  tasks: 'Tarefas',
                  subjects: 'Matérias',
                  flashcards: 'Flashcards',
                  ai: 'Recursos de IA',
                }[key]
              }
            </Label>
          ))}
          <Button
            disabled={
              busy || (!draft.tasks && !draft.subjects && !draft.flashcards)
            }
            onClick={() => void advance('classroom')}
          >
            Continuar
          </Button>
        </>
      ) : (
        <>
          <ClassroomSection prefs={prefs} />
          <p>
            Você pode continuar mesmo se a integração falhar. Operações já
            solicitadas continuam e ficam disponíveis no perfil.
          </p>
          <div className="classroom-actions">
            <Button disabled={busy} onClick={() => void advance('completed')}>
              Continuar para o Edutrack
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void advance('completed')}
            >
              Agora não
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
