import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { FieldSet } from '@study-platform/ui/components/ui/field';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@study-platform/ui/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@study-platform/ui/components/ui/pagination';

import { Label } from '@study-platform/ui/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';
import { Textarea } from '@study-platform/ui/components/ui/textarea';
import { Input } from '@study-platform/ui/components/ui/input';
import { Button } from '@study-platform/ui/components/ui/button';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import { Map, Plus, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  generationParametersSchema,
  roadmapContentSchema,
  roadmapDraftSchema,
} from '@study-platform/contracts';
import type {
  Roadmap,
  RoadmapDraft,
  RoadmapList,
  RoadmapParameters,
  RoadmapPreview,
  StudySubject,
} from '@study-platform/contracts';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import { blankRoadmap, RoadmapEditor } from './RoadmapEditor.js';
import { RoadmapRevisionTools } from './RoadmapRevisionTools.js';
import {
  confirmRoadmap,
  deleteRoadmap,
  generateRoadmap,
  listRoadmaps,
  saveRoadmap,
} from './roadmaps-api.js';
function failure(cause: unknown) {
  if (cause instanceof AuthApiError) {
    if (cause.status === 401) {
      navigate('/acesso?returnTo=%2Fapp%2Fmaterias');
      return 'Entre novamente para continuar.';
    }
    const errors: Record<string, string> = {
      AI_DISABLED: 'Ative a IA nas preferências para continuar.',
      MODULE_DISABLED: 'Reative matérias nas preferências.',
      AI_UNAVAILABLE:
        'A geração por IA está indisponível. Você pode criar um roadmap manual.',
      AI_TIMEOUT: 'A IA demorou para responder. Tente gerar novamente.',
      AI_INVALID_RESPONSE:
        'A IA retornou uma resposta inválida. Tente gerar novamente.',
      INVALID_RECEIPT: 'A prévia não é válida. Gere novamente.',
      REVISION_CONFLICT:
        'O roadmap mudou. Cancele a edição e atualize a lista para editar a versão atual.',
      DUPLICATE_STEPS: 'Corrija os títulos repetidos no roadmap.',
      PROTECTED_STEPS: 'O trecho até o último passo concluído está protegido.',
      RECEIPT_EXPIRED: 'A prévia expirou. Gere novamente.',
    };
    if (errors[cause.code]) return errors[cause.code]!;
  }
  return 'Não foi possível concluir a ação. Sua edição foi preservada. Tente novamente.';
}
function ParametersForm({
  subject,
  busy,
  onGenerate,
  onCancel,
}: {
  subject: StudySubject;
  busy: boolean;
  onGenerate: (params: RoadmapParameters) => void;
  onCancel: () => void;
}) {
  const [level, setLevel] = useState(subject.currentLevel);
  const [objective, setObjective] = useState(subject.objective);
  const [date, setDate] = useState(subject.dueDate);
  const [hours, setHours] = useState(String(subject.weeklyHours));
  const [topics, setTopics] = useState(subject.knownTopics.join('\n'));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const first = useRef<HTMLSelectElement>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const fieldError = (field: string) =>
    errors[field] ? (
      <Alert variant="destructive" id={`roadmap-${field}-error`} role="alert">
        <AlertDescription>{errors[field]}</AlertDescription>
      </Alert>
    ) : null;
  const accessibility = (field: string) => ({
    'aria-invalid': !!errors[field],
    ...(errors[field] ? { 'aria-describedby': `roadmap-${field}-error` } : {}),
  });
  return (
    <form
      className="subject-panel roadmap-parameters"
      ref={form}
      noValidate
      aria-label="Parâmetros da geração"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy) return;
        const parsed = generationParametersSchema().safeParse({
          currentLevel: level,
          objective,
          dueDate: date,
          weeklyHours: Number(hours),
          knownTopics: topics === '' ? [] : topics.split('\n'),
        });
        if (!parsed.success) {
          const messages: Record<string, string> = {
            currentLevel: 'Escolha um nível válido.',
            objective: 'Informe um objetivo de 1 a 500 caracteres.',
            dueDate: 'Informe uma data futura de até cinco anos.',
            weeklyHours: 'Informe entre 0,5 e 80 horas semanais.',
            knownTopics:
              'Informe até 30 assuntos, um por linha, de 1 a 120 caracteres.',
          };
          const result: Record<string, string> = {};
          for (const issue of parsed.error.issues) {
            const key = String(issue.path[0]);
            result[key] = messages[key] ?? 'Revise este campo.';
          }
          setErrors(result);
          const name = Object.keys(result)[0];
          form.current?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
          return;
        }
        setErrors({});
        onGenerate(parsed.data);
      }}
    >
      <h4>Parâmetros da geração</h4>
      <p>Destino: {subject.name}</p>
      <p>
        O nome da matéria e estes parâmetros serão enviados ao provedor de IA.
        Revise antes de gerar.
      </p>
      <FieldSet disabled={busy}>
        <Label>
          Nível atual
          <NativeSelect
            name="currentLevel"
            ref={first}
            value={level}
            {...accessibility('currentLevel')}
            onChange={(e) =>
              setLevel(e.target.value as RoadmapParameters['currentLevel'])
            }
          >
            <NativeSelectOption value="BEGINNER">Iniciante</NativeSelectOption>
            <NativeSelectOption value="INTERMEDIATE">
              Intermediário
            </NativeSelectOption>
            <NativeSelectOption value="ADVANCED">Avançado</NativeSelectOption>
          </NativeSelect>
        </Label>
        {fieldError('currentLevel')}
        <Label>
          Objetivo da geração
          <Textarea
            name="objective"
            value={objective}
            maxLength={500}
            {...accessibility('objective')}
            onChange={(e) => setObjective(e.target.value)}
          />
        </Label>
        {fieldError('objective')}
        <Label>
          Prazo da geração
          <Input
            name="dueDate"
            type="date"
            value={date}
            {...accessibility('dueDate')}
            onChange={(e) => setDate(e.target.value)}
          />
        </Label>
        {fieldError('dueDate')}
        <Label>
          Horas semanais da geração
          <Input
            name="weeklyHours"
            type="number"
            step="any"
            min="0.5"
            max="80"
            value={hours}
            {...accessibility('weeklyHours')}
            onChange={(e) => setHours(e.target.value)}
          />
        </Label>
        {fieldError('weeklyHours')}
        <Label>
          Assuntos conhecidos para a geração
          <Textarea
            name="knownTopics"
            value={topics}
            {...accessibility('knownTopics')}
            onChange={(e) => setTopics(e.target.value)}
          />
        </Label>
        {fieldError('knownTopics')}
        <Button type="submit">Gerar prévia</Button>
      </FieldSet>
      <Button type="button" onClick={onCancel}>
        Cancelar
      </Button>
    </form>
  );
}
export function RoadmapsSection({
  subject,
  aiEnabled,
}: {
  subject: StudySubject;
  aiEnabled: boolean;
}) {
  const [result, setResult] = useState<RoadmapList | null>(null);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState<'generate' | 'save' | 'delete' | null>(null);
  const [mode, setMode] = useState<'manual' | 'parameters' | 'preview' | null>(
    null,
  );
  const [content, setContent] = useState<RoadmapDraft>(blankRoadmap);
  const [editingRevision, setEditingRevision] = useState<number | undefined>(
    undefined,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<RoadmapPreview | null>(null);
  const [deleting, setDeleting] = useState<Roadmap | null>(null);
  const [expired, setExpired] = useState(false);
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  const saving = useRef(false);
  const newButton = useRef<HTMLButtonElement>(null);
  const aiButton = useRef<HTMLButtonElement>(null);
  const previousMode = useRef(mode);
  useEffect(() => {
    if (previousMode.current && !mode)
      (previousMode.current === 'manual'
        ? newButton
        : aiButton
      ).current?.focus();
    previousMode.current = mode;
  }, [mode]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current?.abort();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError('');
    setResult(null);
    void listRoadmaps(subject.id, page)
      .then((value) => {
        if (alive) setResult(value);
      })
      .catch((cause: unknown) => {
        if (alive) setLoadError(failure(cause));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [subject.id, page, revision]);
  useEffect(() => {
    const target = result?.items.find(
      (item) => window.location.hash === `#roadmap-${item.id}`,
    );
    if (target) document.getElementById(`roadmap-${target.id}`)?.focus();
  }, [result]);
  useEffect(() => {
    if (!aiEnabled) {
      request.current?.abort();
      request.current = null;
      setPreview(null);
      setExpired(false);
      setMode((value) => (value === 'manual' ? value : null));
      setBusy((value) => (value === 'generate' ? null : value));
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
  const close = () => {
    const wasAI = mode !== 'manual';
    request.current?.abort();
    request.current = null;
    setBusy(null);
    setMode(null);
    setPreview(null);
    setContent(blankRoadmap());
    setError('');
    setExpired(false);
    (wasAI ? aiButton : newButton).current?.focus();
  };
  const generate = async (parameters: RoadmapParameters) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy('generate');
    setError('');
    setSuccess('');
    try {
      const value = await generateRoadmap(
        subject.id,
        parameters,
        controller.signal,
      );
      if (active.current && request.current === controller) {
        setPreview(value);
        setContent(value.content);
        setMode('preview');
      }
    } catch (cause) {
      if (active.current && !controller.signal.aborted)
        setError(failure(cause));
    } finally {
      if (active.current && request.current === controller) {
        request.current = null;
        setBusy(null);
      }
    }
  };
  const save = async () => {
    if (saving.current || busy || expired) return;
    const parsed = (
      mode === 'manual' && editingId ? roadmapDraftSchema : roadmapContentSchema
    ).safeParse(content);
    if (!parsed.success) {
      setError(
        'Preencha títulos e descrições. Use de 1 a 20 blocos e de 1 a 20 passos por bloco.',
      );
      return;
    }
    saving.current = true;
    setBusy('save');
    setError('');
    setSuccess('');
    try {
      if (mode === 'preview' && preview)
        await confirmRoadmap(subject.id, preview.receipt, parsed.data);
      else
        await saveRoadmap(subject.id, editingId, parsed.data, editingRevision);
      if (active.current) {
        close();
        setSuccess('Roadmap salvo.');
        setPage(1);
        setRevision((value) => value + 1);
      }
    } catch (cause) {
      if (active.current) {
        setError(failure(cause));
        if (cause instanceof AuthApiError && cause.code === 'RECEIPT_EXPIRED')
          setExpired(true);
      }
    } finally {
      saving.current = false;
      if (active.current) setBusy(null);
    }
  };
  return (
    <section aria-label="Roadmaps" className="roadmaps-section subject-panel">
      <h3>
        <Map aria-hidden="true" />
        Roadmaps
      </h3>
      <div className="subject-actions">
        <Button
          ref={newButton}
          disabled={!!busy || !!mode || !!deleting}
          onClick={() => {
            setContent(blankRoadmap());
            setEditingId(null);
            setMode('manual');
            setError('');
            setSuccess('');
          }}
        >
          <Plus aria-hidden="true" />
          Criar roadmap manual
        </Button>
        {aiEnabled && (
          <Button
            variant="outline"
            ref={aiButton}
            disabled={!!busy || !!mode || !!deleting}
            onClick={() => {
              setMode('parameters');
              setPreview(null);
              setError('');
              setSuccess('');
            }}
          >
            <Sparkles aria-hidden="true" />
            Aprimorar com IA
          </Button>
        )}
      </div>
      {loading && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando roadmaps…</p>
        </div>
      )}
      {loadError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            <p>{loadError}</p>
            <Button onClick={() => setRevision((value) => value + 1)}>
              Tentar carregar roadmaps novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {error && !deleting && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && <p role="status">{success}</p>}
      {busy && (
        <p role="status">
          {busy === 'generate'
            ? 'Gerando prévia…'
            : busy === 'save'
              ? 'Salvando roadmap…'
              : 'Excluindo roadmap…'}
        </p>
      )}
      {mode === 'parameters' && aiEnabled && (
        <ParametersForm
          subject={subject}
          busy={busy === 'generate'}
          onGenerate={(params) => {
            void generate(params);
          }}
          onCancel={close}
        />
      )}
      {(mode === 'manual' || mode === 'preview') && (
        <form
          className="subject-panel roadmap-edit-form"
          data-preview={mode === 'preview' || undefined}
          aria-label={
            mode === 'preview' ? 'Revisar prévia' : 'Editor manual de roadmap'
          }
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h4>
            {mode === 'preview'
              ? 'Prévia do roadmap'
              : editingId
                ? 'Editar roadmap'
                : 'Novo roadmap manual'}
          </h4>
          {mode === 'preview' && preview && (
            <>
              <p>
                Revise e edite antes de salvar. A prévia ainda não foi salva.
              </p>
              <dl>
                <dt>Nível da geração</dt>
                <dd>
                  {
                    {
                      BEGINNER: 'Iniciante',
                      INTERMEDIATE: 'Intermediário',
                      ADVANCED: 'Avançado',
                    }[preview.parameters.currentLevel]
                  }
                </dd>
                <dt>Objetivo da geração</dt>
                <dd>{preview.parameters.objective}</dd>
                <dt>Prazo da geração</dt>
                <dd>{preview.parameters.dueDate}</dd>
                <dt>Horas semanais da geração</dt>
                <dd>{preview.parameters.weeklyHours}</dd>
                <dt>Assuntos conhecidos da geração</dt>
                <dd>{preview.parameters.knownTopics.join(', ') || 'Nenhum'}</dd>
              </dl>
              <p>
                Prévia válida até{' '}
                {new Date(preview.expiresAt).toLocaleString('pt-BR')}.
              </p>
              {expired && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>
                    A prévia expirou. Gere novamente para salvar.
                  </AlertDescription>
                </Alert>
              )}
              <Button
                type="button"
                disabled={!!busy}
                onClick={() => {
                  setPreview(null);
                  setMode('parameters');
                  setError('');
                  setExpired(false);
                }}
              >
                Gerar novamente
              </Button>
            </>
          )}
          <RoadmapEditor
            value={content}
            onChange={setContent}
            disabled={!!busy}
          />
          <div className="subject-actions">
            <Button type="submit" disabled={!!busy || expired}>
              Salvar roadmap
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={!!busy}
              onClick={close}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
      {result && !result.items.length && (
        <p className="subject-empty">
          Você ainda não tem roadmaps. Crie um roadmap para organizar blocos e
          passos.
        </p>
      )}
      {result?.items.map((roadmap) => (
        <Card key={roadmap.id} asChild>
          <article
            className="subject-card roadmap-card"

            id={`roadmap-${roadmap.id}`}
            tabIndex={-1}
          >
            <CardContent>
              <h4>{roadmap.title}</h4>
              <p>{roadmap.description}</p>
              <ol className="roadmap-content">
                {roadmap.blocks.map((block, index) => (
                  <li key={index}>
                    <h5>{block.title}</h5>
                    <p>{block.description}</p>
                    <ol>
                      {block.steps.map((step, stepIndex) => (
                        <li key={stepIndex}>
                          <strong>{step.title}</strong>
                          <p>{step.description}</p>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
              <div className="subject-actions">
                <Button
                  variant="outline"
                  disabled={!!mode || !!busy || !!deleting}
                  onClick={() => {
                    setEditingId(roadmap.id);
                    setEditingRevision(roadmap.revision);
                    setContent({
                      title: roadmap.title,
                      description: roadmap.description,
                      blocks: roadmap.blocks,
                    });
                    setMode('manual');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Editar roadmap {roadmap.title}
                </Button>
                <Button
                  variant="ghost"
                  className="subject-danger"
                  disabled={!!mode || !!busy || !!deleting}
                  onClick={() => {
                    setDeleting(roadmap);
                    setError('');
                    setSuccess('');
                  }}
                >
                  Excluir roadmap {roadmap.title}
                </Button>
              </div>
              <RoadmapRevisionTools
                roadmap={roadmap}
                aiEnabled={aiEnabled}
                disabled={!!mode || !!busy || !!deleting}
                onChanged={() => {
                  setSuccess('Roadmap atualizado.');
                  setRevision((value) => value + 1);
                  newButton.current?.focus();
                }}
              />
            </CardContent>
          </article>
        </Card>
      ))}
      {deleting && (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open && !busy) setDeleting(null);
          }}
        >
          <AlertDialogContent
            className="subject-dialog"
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              if (!busy) setDeleting(null);
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              newButton.current?.focus();
            }}
          >
            <AlertDialogTitle>Confirmar exclusão do roadmap</AlertDialogTitle>
            <div role="group" aria-label="Confirmar exclusão do roadmap">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <AlertDialogDescription asChild>
                <p>Excluir {deleting.title} e seus blocos e passos?</p>
              </AlertDialogDescription>
              <Button
                variant="outline"
                autoFocus
                disabled={!!busy}
                onClick={() => {
                  setDeleting(null);
                  newButton.current?.focus();
                }}
              >
                Cancelar exclusão do roadmap
              </Button>
              <Button
                variant="destructive"
                disabled={!!busy}
                onClick={async () => {
                  if (saving.current) return;
                  saving.current = true;
                  setBusy('delete');
                  setError('');
                  try {
                    await deleteRoadmap(subject.id, deleting.id);
                    if (active.current) {
                      setDeleting(null);
                      setPage(1);
                      setRevision((value) => value + 1);
                      setSuccess('Roadmap excluído.');
                      newButton.current?.focus();
                    }
                  } catch (cause) {
                    if (active.current) setError(failure(cause));
                  } finally {
                    saving.current = false;
                    if (active.current) setBusy(null);
                  }
                }}
              >
                Confirmar exclusão do roadmap
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {result && result.totalPages > 1 && (
        <Pagination aria-label="Paginação de roadmaps">
          <PaginationContent className="flex-wrap">
            <PaginationItem>
              <Button
                disabled={page === 1 || !!mode || !!busy}
                onClick={() => setPage(page - 1)}
              >
                Roadmaps anteriores
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span>
                Página {page} de {result.totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                disabled={page >= result.totalPages || !!mode || !!busy}
                onClick={() => setPage(page + 1)}
              >
                Próximos roadmaps
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  );
}
