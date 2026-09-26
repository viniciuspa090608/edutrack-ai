import { useEffect, useRef, useState } from 'react';
import {
  completedBoundary,
  flattenRoadmap,
  sequenceDuplicates,
  sequenceSchema,
} from '@study-platform/contracts';
import type {
  Roadmap,
  RoadmapRevision,
  RevisionPreview,
  SequenceStep,
  RevisionList,
} from '@study-platform/contracts';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import {
  changeStepProgress,
  confirmRevision,
  regenerateSteps,
  restoreRevision,
  roadmapHistory,
  roadmapRevision,
} from './roadmaps-api.js';
const origins = { manual: 'Manual', ia: 'IA', restauracao: 'Restauração' };
function failure(cause: unknown) {
  if (cause instanceof AuthApiError) {
    if (cause.status === 401) {
      navigate('/acesso?returnTo=%2Fapp%2Fmaterias');
      return 'Entre novamente para continuar.';
    }
    const messages: Record<string, string> = {
      REVISION_CONFLICT:
        'O roadmap mudou. Atualize a versão e prepare uma nova prévia.',
      AI_DISABLED: 'Ative a IA nas preferências.',
      MODULE_DISABLED: 'Reative matérias nas preferências.',
      AI_UNAVAILABLE: 'A IA está indisponível. Tente novamente ou cancele.',
      AI_TIMEOUT: 'A IA demorou para responder. Tente novamente ou cancele.',
      AI_INVALID_RESPONSE:
        'A continuação recebida é inválida. Tente novamente ou cancele.',
      PROTECTED_STEPS: 'O trecho até o último passo concluído está protegido.',
      DUPLICATE_STEPS: 'Corrija os passos com títulos repetidos.',
      INVALID_STEP_ID: 'A identidade ou conclusão de um passo é inválida.',
      RESTORATION_INCOMPATIBLE:
        'Esta revisão é incompatível com o progresso atual. Escolha outra revisão.',
      INVALID_RECEIPT: 'A prévia não é válida. Prepare uma nova prévia.',
      RECEIPT_EXPIRED: 'A prévia expirou. Prepare uma nova prévia.',
    };
    if (messages[cause.code]) return messages[cause.code]!;
  }
  return 'Não foi possível concluir. A versão ativa permanece disponível e a edição foi preservada. Tente novamente.';
}
function moved<T>(items: T[], index: number, direction: number) {
  const result = [...items];
  [result[index], result[index + direction]] = [
    result[index + direction]!,
    result[index]!,
  ];
  return result;
}
export function RoadmapRevisionTools({
  roadmap,
  aiEnabled,
  disabled,
  onChanged,
}: {
  roadmap: Roadmap;
  aiEnabled: boolean;
  disabled: boolean;
  onChanged: () => void;
}) {
  const activeSteps = flattenRoadmap(roadmap),
    boundary = completedBoundary(activeSteps);
  const [ordered, setOrdered] = useState(activeSteps),
    [movedId, setMovedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'order' | 'preview' | null>(null),
    [preview, setPreview] = useState<RevisionPreview | null>(null),
    [steps, setSteps] = useState<SequenceStep[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [conflict, setConflict] = useState(false),
    [expired, setExpired] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false),
    [historyPage, setHistoryPage] = useState(1),
    [history, setHistory] = useState<RevisionList | null>(null),
    [selected, setSelected] = useState<RoadmapRevision | null>(null),
    [historyLoading, setHistoryLoading] = useState(false),
    [historyError, setHistoryError] = useState(''),
    [historyReload, setHistoryReload] = useState(0);
  const alive = useRef(true),
    pending = useRef<AbortController | null>(null),
    submitting = useRef(false),
    trigger = useRef<HTMLButtonElement>(null),
    restoreButton = useRef<HTMLButtonElement>(null),
    lastAction = useRef<'ai' | 'restore'>('ai'),
    returnFocus = useRef(false),
    heading = useRef<HTMLHeadingElement>(null),
    firstEditable = useRef<HTMLInputElement>(null),
    historyHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      pending.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (mode === 'preview') heading.current?.focus();
    else if (mode === 'order') heading.current?.focus();
  }, [mode]);
  useEffect(() => {
    if (selected) historyHeading.current?.focus();
  }, [selected]);
  useEffect(() => {
    if (returnFocus.current && !mode && !busy) {
      (lastAction.current === 'restore'
        ? restoreButton
        : trigger
      ).current?.focus();
      returnFocus.current = false;
    }
  }, [mode, busy]);
  useEffect(() => {
    if (!aiEnabled && (mode === 'order' || preview?.origin === 'ia')) {
      pending.current?.abort();
      pending.current = null;
      setMode(null);
      setPreview(null);
      setSteps([]);
      setBusy(false);
      setError('');
    }
  }, [aiEnabled]);
  useEffect(() => {
    if (!preview) return;
    const remaining = Date.parse(preview.expiresAt) - Date.now();
    setExpired(remaining <= 0);
    const timer = window.setTimeout(
      () => setExpired(true),
      Math.max(0, remaining),
    );
    return () => window.clearTimeout(timer);
  }, [preview]);
  useEffect(() => {
    if (!historyOpen) return;
    let active = true;
    setHistoryLoading(true);
    setHistoryError('');
    void roadmapHistory(roadmap.subjectId, roadmap.id, historyPage)
      .then((value) => {
        if (active) setHistory(value);
      })
      .catch((cause: unknown) => {
        if (active) setHistoryError(failure(cause));
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [historyOpen, historyPage, historyReload, roadmap.revision]);
  const close = () => {
    returnFocus.current = true;
    pending.current?.abort();
    pending.current = null;
    setMode(null);
    setPreview(null);
    setSteps([]);
    setBusy(false);
    setError('');
    setConflict(false);
    setExpired(false);
  };
  const handleError = (cause: unknown) => {
    setError(failure(cause));
    if (cause instanceof AuthApiError) {
      if (cause.code === 'REVISION_CONFLICT') setConflict(true);
      if (cause.code === 'RECEIPT_EXPIRED' || cause.code === 'INVALID_RECEIPT')
        setExpired(true);
    }
  };
  const prepare = async (sourceRevision?: number) => {
    if (pending.current || submitting.current) return;
    lastAction.current = sourceRevision === undefined ? 'ai' : 'restore';
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    setSuccess('');
    setConflict(false);
    try {
      const value =
        sourceRevision === undefined
          ? await regenerateSteps(
              roadmap.subjectId,
              roadmap.id,
              {
                baseRevision: roadmap.revision,
                movedStepId: movedId!,
                pendingOrder: ordered.slice(boundary).map((step) => step.id),
              },
              controller.signal,
            )
          : await restoreRevision(
              roadmap.subjectId,
              roadmap.id,
              roadmap.revision,
              sourceRevision,
              controller.signal,
            );
      if (
        value.roadmapId !== roadmap.id ||
        value.baseRevision !== roadmap.revision
      )
        throw new Error('Invalid preview');
      if (alive.current && pending.current === controller) {
        setPreview(value);
        setSteps(value.steps);
        setMode('preview');
      }
    } catch (cause) {
      if (alive.current && !controller.signal.aborted) handleError(cause);
    } finally {
      if (alive.current && pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  };
  const duplicates = sequenceDuplicates(steps);
  const save = async () => {
    if (!preview || submitting.current || busy || conflict || expired) return;
    if (!sequenceSchema.safeParse(steps).success || duplicates.length) {
      setError(
        duplicates.length
          ? `Corrija os passos repetidos: ${duplicates.join(', ')}.`
          : 'Preencha títulos e descrições da continuação.',
      );
      firstEditable.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await confirmRevision(roadmap.subjectId, roadmap.id, preview, steps);
      if (alive.current) {
        close();
        setSuccess('Nova revisão confirmada.');
        onChanged();
      }
    } catch (cause) {
      if (alive.current) handleError(cause);
    } finally {
      submitting.current = false;
      if (alive.current) setBusy(false);
    }
  };
  return (
    <section
      className="roadmap-revisions"
      aria-label={`Progresso e versões de ${roadmap.title}`}
    >
      <p>
        Revisão ativa {roadmap.revision}. Passos até o último concluído ficam
        protegidos.
      </p>
      <fieldset
        disabled={disabled || busy || !!mode}
        aria-label="Progresso dos passos"
      >
        <legend>Progresso</legend>
        {activeSteps.map((step) => (
          <label className="roadmap-progress" key={step.id}>
            <input
              type="checkbox"
              checked={step.completed}
              aria-label={`Concluído: ${step.title}`}
              onChange={async (event) => {
                if (submitting.current) return;
                submitting.current = true;
                setBusy(true);
                setError('');
                setSuccess('');
                try {
                  await changeStepProgress(
                    roadmap.subjectId,
                    roadmap.id,
                    step.id,
                    roadmap.revision,
                    event.target.checked,
                  );
                  if (alive.current) {
                    setSuccess('Progresso atualizado.');
                    onChanged();
                  }
                } catch (cause) {
                  if (alive.current) handleError(cause);
                } finally {
                  submitting.current = false;
                  if (alive.current) setBusy(false);
                }
              }}
            />
            {step.title}
            {step.completed ? ' — concluído' : ''}
          </label>
        ))}
      </fieldset>
      <div className="subject-actions">
        {aiEnabled && (
          <button
            ref={trigger}
            disabled={
              disabled || busy || !!mode || boundary === activeSteps.length
            }
            onClick={() => {
              lastAction.current = 'ai';
              setOrdered(activeSteps);
              setMovedId(null);
              setMode('order');
              setError('');
              setSuccess('');
              setConflict(false);
            }}
          >
            Reorganizar e regenerar passos
          </button>
        )}
        <button
          disabled={disabled || busy || !!mode}
          onClick={() => {
            setHistoryOpen(!historyOpen);
            setSelected(null);
            setHistoryPage(1);
            setError('');
          }}
        >
          {' '}
          {historyOpen ? 'Fechar histórico' : 'Ver histórico'}{' '}
        </button>
      </div>
      {busy && <p role="status">Processando revisão…</p>}
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      {conflict && (
        <button
          disabled={busy}
          onClick={() => {
            close();
            onChanged();
          }}
        >
          Atualizar versão do roadmap
        </button>
      )}
      {mode === 'order' && aiEnabled && (
        <section aria-label="Reordenar passos pendentes">
          <h5 ref={heading} tabIndex={-1}>
            Reordenar passos
          </h5>
          <p>
            Mova um passo pendente. O último passo movido será a âncora; apenas
            a continuação posterior será sugerida pela IA. Esta ordem ainda não
            foi salva.
          </p>
          <ol>
            {ordered.map((step, index) => (
              <li key={step.id}>
                <strong>{step.title}</strong>
                <p>
                  {index < boundary
                    ? 'Trecho protegido'
                    : step.id === movedId
                      ? 'Âncora da regeneração'
                      : 'Pendente'}
                </p>
                <div className="subject-actions">
                  <button
                    disabled={busy || index <= boundary}
                    onClick={() => {
                      setOrdered(moved(ordered, index, -1));
                      setMovedId(step.id);
                    }}
                  >
                    Subir {step.title}
                  </button>
                  <button
                    disabled={
                      busy || index < boundary || index === ordered.length - 1
                    }
                    onClick={() => {
                      setOrdered(moved(ordered, index, 1));
                      setMovedId(step.id);
                    }}
                  >
                    Descer {step.title}
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div className="subject-actions">
            <button
              disabled={busy || !movedId || conflict}
              onClick={() => {
                void prepare();
              }}
            >
              Regenerar continuação
            </button>
            <button onClick={close}>Cancelar revisão</button>
          </div>
        </section>
      )}
      {mode === 'preview' && preview && (
        <form
          aria-label="Prévia da revisão"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h5 ref={heading} tabIndex={-1}>
            Prévia da revisão
          </h5>
          <p>
            {preview.origin === 'restauracao'
              ? `Restauração da revisão ${preview.sourceRevision}`
              : 'Continuação sugerida por IA'}
            . Base: revisão {preview.baseRevision}. Nada foi salvo.
          </p>
          <p>
            Prévia válida até{' '}
            {new Date(preview.expiresAt).toLocaleString('pt-BR')}.
          </p>
          {expired && (
            <p role="alert">
              A prévia expirou ou foi invalidada. Cancele e prepare uma nova.
            </p>
          )}
          {preview.warnings.map((warning, index) => (
            <p role="status" key={index}>
              {warning}
            </p>
          ))}
          {duplicates.length > 0 && (
            <p role="alert">Passos repetidos: {duplicates.join(', ')}.</p>
          )}
          <ol>
            {steps.map((step, index) => (
              <li key={step.id}>
                {index < preview.preservedCount ? (
                  <>
                    <strong>{step.title} — preservado</strong>
                    <p>{step.description}</p>
                    <p>
                      {step.blockTitle}
                      {step.completed ? ' · concluído' : ''}
                    </p>
                  </>
                ) : (
                  <fieldset disabled={busy}>
                    <legend>
                      Passo {index + 1} —{' '}
                      {preview.origin === 'ia' ? 'sugerido' : 'restaurado'}
                    </legend>
                    <label>
                      Título do passo sugerido {index + 1}
                      <input
                        ref={
                          index === preview.preservedCount
                            ? firstEditable
                            : undefined
                        }
                        required
                        maxLength={120}
                        value={step.title}
                        onChange={(event) =>
                          setSteps(
                            steps.map((item, i) =>
                              i === index
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Descrição do passo sugerido {index + 1}
                      <textarea
                        required
                        maxLength={1000}
                        value={step.description}
                        onChange={(event) =>
                          setSteps(
                            steps.map((item, i) =>
                              i === index
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                    <div className="subject-actions">
                      <button
                        type="button"
                        disabled={index === preview.preservedCount}
                        onClick={() => setSteps(moved(steps, index, -1))}
                      >
                        Subir sugestão {index + 1}
                      </button>
                      <button
                        type="button"
                        disabled={index === steps.length - 1}
                        onClick={() => setSteps(moved(steps, index, 1))}
                      >
                        Descer sugestão {index + 1}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSteps(steps.filter((_, i) => i !== index))
                        }
                      >
                        Remover sugestão {index + 1}
                      </button>
                    </div>
                  </fieldset>
                )}
              </li>
            ))}
          </ol>
          <div className="subject-actions">
            <button
              type="submit"
              disabled={busy || conflict || expired || !!duplicates.length}
            >
              Confirmar revisão
            </button>
            <button type="button" disabled={busy} onClick={close}>
              Cancelar revisão
            </button>
          </div>
        </form>
      )}
      {historyOpen && (
        <section aria-label="Histórico de revisões">
          <h5>Histórico de revisões</h5>
          {historyLoading && <p role="status">Carregando histórico…</p>}
          {historyError && (
            <div role="alert">
              <p>{historyError}</p>
              <button onClick={() => setHistoryReload((value) => value + 1)}>
                Tentar carregar histórico novamente
              </button>
            </div>
          )}
          {history && !history.items.length && (
            <p>Nenhuma revisão disponível.</p>
          )}
          <ul className="subject-list">
            {history?.items.map((item) => (
              <li key={item.revision}>
                Revisão {item.revision} · {origins[item.origin]} ·{' '}
                {new Date(item.createdAt).toLocaleString('pt-BR')}
                {item.revision === roadmap.revision ? ' · ativa' : ''}
                <button
                  disabled={disabled || busy || !!mode}
                  onClick={async () => {
                    if (submitting.current) return;
                    submitting.current = true;
                    setBusy(true);
                    setError('');
                    try {
                      const snapshot = await roadmapRevision(
                        roadmap.subjectId,
                        roadmap.id,
                        item.revision,
                      );
                      if (alive.current) setSelected(snapshot);
                    } catch (cause) {
                      if (alive.current) handleError(cause);
                    } finally {
                      submitting.current = false;
                      if (alive.current) setBusy(false);
                    }
                  }}
                >
                  Consultar revisão {item.revision}
                </button>
              </li>
            ))}
          </ul>
          {history && history.totalPages > 1 && (
            <nav aria-label="Paginação do histórico">
              <button
                disabled={historyPage === 1 || busy || !!mode}
                onClick={() => setHistoryPage(historyPage - 1)}
              >
                Revisões anteriores
              </button>
              <span>
                Página {historyPage} de {history.totalPages}
              </span>
              <button
                disabled={historyPage >= history.totalPages || busy || !!mode}
                onClick={() => setHistoryPage(historyPage + 1)}
              >
                Próximas revisões
              </button>
            </nav>
          )}
          {selected && (
            <section aria-label="Revisão histórica">
              <h5 ref={historyHeading} tabIndex={-1}>
                Revisão {selected.revision} — {origins[selected.origin]}
              </h5>
              <p>{selected.content.title}</p>
              <ol>
                {flattenRoadmap(selected.content).map((step) => (
                  <li key={step.id}>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                    <p>
                      {step.completed
                        ? 'Concluído nesta revisão'
                        : 'Pendente nesta revisão'}
                    </p>
                  </li>
                ))}
              </ol>
              <button
                ref={restoreButton}
                disabled={disabled || busy || !!mode}
                onClick={() => {
                  void prepare(selected.revision);
                }}
              >
                Preparar restauração
              </button>
              {busy && pending.current && (
                <button onClick={close}>Cancelar revisão</button>
              )}
            </section>
          )}
        </section>
      )}
    </section>
  );
}
