import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@study-platform/ui/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@study-platform/ui/components/ui/pagination';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@study-platform/ui/components/ui/alert-dialog';
import { Label } from '@study-platform/ui/components/ui/label';
import { Input } from '@study-platform/ui/components/ui/input';
import { Textarea } from '@study-platform/ui/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';
import { Button } from '@study-platform/ui/components/ui/button';

import {
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Flag,
  ListFilter,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SubtasksSection } from './SubtasksSection.js';
import { TaskProgress } from './TaskProgress.js';
import { createTaskSchema, taskFiltersSchema } from '@study-platform/contracts';
import type {
  StudyTask,
  TaskFilters,
  TaskList,
} from '@study-platform/contracts';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import { deleteTask, listTasks, saveTask, taskDetail } from './tasks-api.js';
import '../../styles/tasks.css';
import { CollectionEmptyState } from '../../components/CollectionEmptyState.js';

import { SubjectSelect } from '../subjects/SubjectSelect.js';
import { subjectDetail } from '../subjects/subjects-api.js';
const statuses = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
};
const priorities = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };
const initialFilters: TaskFilters = { page: 1, pageSize: 20 };
function TaskBadges({ task }: { task: StudyTask }) {
  return (
    <div className="task-badges">
      <span className="task-badge" data-status={task.status}>
        <CheckCheck aria-hidden="true" />
        {statuses[task.status]}
      </span>
      <span className="task-badge" data-priority={task.priority}>
        <Flag aria-hidden="true" />
        Importância {priorities[task.priority].toLowerCase()}
      </span>
    </div>
  );
}
function dateLabel(value: string) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
function failure(cause: unknown) {
  if (
    cause instanceof AuthApiError &&
    (cause.status === 401 || cause.code === 'EMAIL_VERIFICATION_REQUIRED')
  ) {
    navigate('/acesso?returnTo=%2Fapp%2Ftarefas');
    return 'Entre novamente para continuar.';
  }
  if (cause instanceof AuthApiError && cause.code === 'MODULE_DISABLED')
    return 'Tarefas está desativado. Reative nas preferências da conta.';
  return 'Não foi possível concluir a ação. Tente novamente.';
}

function TaskForm({
  task,
  onSaved,
  onCancel,
  subjectsEnabled,
}: {
  subjectsEnabled: boolean;
  task: StudyTask | null;
  onSaved: (task: StudyTask) => void;
  onCancel: () => void;
}) {
  const [subjectId, setSubjectId] = useState(task?.subjectId ?? '');
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState(task?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState(task?.status ?? 'PENDING');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <Card asChild>
      <form
        className="task-card task-form"
        aria-label={task ? 'Editar tarefa' : 'Criar tarefa'}
        noValidate
        onSubmit={async (event) => {
          event.preventDefault();
          if (submitting.current) return;
          const parsed = createTaskSchema.safeParse({
            ...(subjectsEnabled
              ? { subjectId: subjectId || null }
              : task
                ? { subjectId: task.subjectId }
                : {}),
            title,
            description: description || null,
            priority,
            status,
            dueDate: dueDate || null,
          });
          if (!parsed.success) {
            const errors: Record<string, string> = {};
            for (const issue of parsed.error.issues)
              errors[String(issue.path[0])] =
                issue.path[0] === 'title'
                  ? 'Informe um título de 1 a 160 caracteres.'
                  : issue.path[0] === 'description'
                    ? 'Use até 2.000 caracteres.'
                    : 'Informe uma data ou opção válida.';
            setInvalid(errors);
            setError('Revise os campos indicados.');
            document.getElementById(`task-${Object.keys(errors)[0]}`)?.focus();
            return;
          }
          submitting.current = true;
          setBusy(true);
          setError('');
          setInvalid({});
          try {
            const input = task?.subtaskTotal
              ? {
                  ...(subjectsEnabled
                    ? { subjectId: parsed.data.subjectId }
                    : {}),
                  title: parsed.data.title,
                  description: parsed.data.description,
                  priority: parsed.data.priority,
                  dueDate: parsed.data.dueDate,
                }
              : subjectsEnabled
                ? parsed.data
                : Object.fromEntries(
                    Object.entries(parsed.data).filter(
                      ([key]) => key !== 'subjectId',
                    ),
                  );
            onSaved(await saveTask(task?.id ?? null, input));
          } catch (cause) {
            setError(failure(cause));
          } finally {
            submitting.current = false;
            setBusy(false);
          }
        }}
      >
        <CardHeader>
          <div className="task-section-heading">
            <span className="task-icon">
              <ClipboardList aria-hidden="true" />
            </span>
            <div>
              <h2>{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>
              <p className="task-muted">
                Organize os próximos passos dos seus estudos.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FieldSet disabled={busy} className="task-fields">
            {subjectsEnabled && (
              <SubjectSelect
                value={subjectId}
                onChange={setSubjectId}
                disabled={busy}
              />
            )}
            <div className="task-field task-field-wide">
              <Label htmlFor="task-title">Título</Label>
              <Input
                ref={titleRef}
                id="task-title"
                value={title}
                maxLength={160}
                required
                aria-invalid={!!invalid.title}
                aria-describedby={
                  invalid.title ? 'task-title-error' : undefined
                }
                onChange={(event) => setTitle(event.target.value)}
              />
              {invalid.title && <p id="task-title-error">{invalid.title}</p>}
            </div>
            <div className="task-field task-field-wide">
              <Label htmlFor="task-description">Descrição (opcional)</Label>
              <Textarea
                id="task-description"
                value={description}
                maxLength={2000}
                aria-invalid={!!invalid.description}
                aria-describedby={
                  invalid.description ? 'task-description-error' : undefined
                }
                onChange={(event) => setDescription(event.target.value)}
              />
              {invalid.description && (
                <p id="task-description-error">{invalid.description}</p>
              )}
            </div>
            <div className="task-field">
              <Label htmlFor="task-priority">Importância</Label>
              <NativeSelect
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as StudyTask['priority'])
                }
              >
                {Object.entries(priorities).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="task-field">
              <Label htmlFor="task-dueDate">Prazo (opcional)</Label>
              <Input
                id="task-dueDate"
                type="date"
                min="1000-01-01"
                max="9999-12-31"
                value={dueDate}
                aria-invalid={!!invalid.dueDate}
                aria-describedby={
                  invalid.dueDate ? 'task-dueDate-error' : undefined
                }
                onChange={(event) => setDueDate(event.target.value)}
              />
              {invalid.dueDate && (
                <p id="task-dueDate-error">{invalid.dueDate}</p>
              )}
            </div>
            <div className="task-field task-field-wide">
              {task?.subtaskTotal ? (
                <p>
                  Status calculado pelas subtarefas. Conclua ou reabra os passos
                  no detalhe da tarefa.
                </p>
              ) : (
                <>
                  <Label htmlFor="task-status">Status</Label>
                  <NativeSelect
                    id="task-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StudyTask['status'])
                    }
                  >
                    {Object.entries(statuses).map(([value, label]) => (
                      <NativeSelectOption key={value} value={value}>
                        {label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </>
              )}
            </div>
            <div className="task-actions">
              <Button type="submit">
                {busy ? 'Salvando…' : 'Salvar tarefa'}
              </Button>
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar edição
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

function DeleteConfirmation({
  task,
  onClose,
  onDeleted,
}: {
  task: StudyTask;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const previousFocus = useRef(document.activeElement);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <AlertDialogContent
        className="tasks-surface task-confirmation"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const element = previousFocus.current;
          if (element instanceof HTMLElement && element.isConnected)
            element.focus();
          else document.getElementById('task-create')?.focus();
        }}
        aria-labelledby="delete-heading"
        aria-describedby="delete-description"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          if (!busy) onClose();
        }}
      >
        <span className="task-icon task-icon-danger">
          <Trash2 aria-hidden="true" />
        </span>
        <AlertDialogTitle id="delete-heading">Excluir tarefa?</AlertDialogTitle>
        <AlertDialogDescription id="delete-description">
          “{task.title}” será removida permanentemente.
        </AlertDialogDescription>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="task-actions">
          <Button
            variant="outline"
            type="button"
            autoFocus
            disabled={busy}
            onClick={onClose}
          >
            Cancelar exclusão
          </Button>
          <Button
            variant="destructive"
            type="button"
            disabled={busy}
            onClick={async () => {
              if (submitting.current) return;
              submitting.current = true;
              setBusy(true);
              setError('');
              try {
                await deleteTask(task.id);
                onDeleted();
              } catch (cause) {
                setError(failure(cause));
              } finally {
                submitting.current = false;
                setBusy(false);
              }
            }}
          >
            {busy ? 'Excluindo…' : 'Confirmar exclusão'}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function TasksPage({
  subjectsEnabled = false,
}: {
  subjectsEnabled?: boolean;
}) {
  const [subjectName, setSubjectName] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [draft, setDraft] = useState({
    status: '',
    priority: '',
    dueFrom: '',
    dueTo: '',
  });
  const [filterError, setFilterError] = useState('');
  const [result, setResult] = useState<TaskList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<{ task: StudyTask | null } | null>(null);
  const [detail, setDetail] = useState<StudyTask | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<StudyTask | null>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const onSubtasksChanged = useCallback((value: StudyTask) => {
    setDetail(value);
    setRevision((revision) => revision + 1);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setResult(null);
    void listTasks(filters)
      .then((value) => {
        if (active) setResult(value);
      })
      .catch((cause: unknown) => {
        if (active) setError(failure(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, revision]);
  useEffect(() => {
    if (detail && !editor) detailHeading.current?.focus();
  }, [detail?.id, !!editor]);
  useEffect(() => {
    let active = true;
    setSubjectName('');
    if (subjectsEnabled && detail?.subjectId)
      void subjectDetail(detail.subjectId)
        .then((value) => {
          if (active) setSubjectName(value.name);
        })
        .catch(() => {
          if (active) setSubjectName('Matéria indisponível');
        });
    return () => {
      active = false;
    };
  }, [subjectsEnabled, detail?.subjectId]);
  const filtered = !!(
    filters.status ||
    filters.priority ||
    filters.dueFrom ||
    filters.dueTo
  );
  const refresh = () => setRevision((value) => value + 1);
  const createTask = () => {
    setEditor({ task: null });
    setDetail(null);
    setSuccess('');
  };
  return (
    <div className="tasks-page tasks-surface">
      <div className="tasks-toolbar">
        <div>
          <p className="task-eyebrow">SEU PLANEJAMENTO</p>
          <p className="task-muted">
            Organize seus estudos com prazos, subtarefas e progresso.
          </p>
        </div>
        <Button
          ref={newButton}
          id="task-create"
          type="button"
          onClick={createTask}
        >
          <Plus aria-hidden="true" /> Criar tarefa
        </Button>
      </div>
      {success && (
        <p className="task-feedback task-feedback-success" role="status">
          {success}
        </p>
      )}
      {editor && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (
              !open &&
              !document.getElementById('task-title')?.closest('fieldset')
                ?.disabled
            )
              setEditor(null);
          }}
        >
          <DialogContent
            showCloseButton={false}
            className="tasks-surface task-editor-dialog"
            onInteractOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => {
              if (
                document.getElementById('task-title')?.closest('fieldset')
                  ?.disabled
              )
                event.preventDefault();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!detail) newButton.current?.focus();
              else detailHeading.current?.focus();
            }}
          >
            <DialogTitle asChild>
              <span className="sr-only">Editor de tarefa</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Preencha os dados da tarefa e salve ou cancele a edição.
            </DialogDescription>
            <TaskForm
              key={editor.task?.id ?? 'new'}
              task={editor.task}
              subjectsEnabled={subjectsEnabled}
              onCancel={() => {
                setEditor(null);
                newButton.current?.focus();
              }}
              onSaved={(task) => {
                setEditor(null);
                setDetail(task);
                setSuccess('Tarefa salva.');
                refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      <Card asChild>
        <form
          className="task-card task-filters"
          aria-label="Filtrar tarefas"
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = taskFiltersSchema.safeParse(
              Object.fromEntries(
                Object.entries({
                  ...draft,
                  page: 1,
                  pageSize: filters.pageSize,
                }).filter(([, value]) => value !== ''),
              ),
            );
            if (!parsed.success) {
              setFilterError(
                'Informe filtros válidos e um prazo final igual ou posterior ao inicial.',
              );
              return;
            }
            setFilterError('');
            setFilters(parsed.data);
            setSuccess('');
          }}
        >
          <CardHeader>
            <div className="task-section-heading">
              <ListFilter aria-hidden="true" />
              <h2>Filtros</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="task-filter-grid">
              <div className="task-field">
                <Label htmlFor="filter-status">Filtrar por status</Label>
                <NativeSelect
                  id="filter-status"
                  value={draft.status}
                  onChange={(e) =>
                    setDraft({ ...draft, status: e.target.value })
                  }
                >
                  <NativeSelectOption value="">
                    Todos os status
                  </NativeSelectOption>
                  {Object.entries(statuses).map(([v, label]) => (
                    <NativeSelectOption key={v} value={v}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="task-field">
                <Label htmlFor="filter-priority">Filtrar por importância</Label>
                <NativeSelect
                  id="filter-priority"
                  value={draft.priority}
                  onChange={(e) =>
                    setDraft({ ...draft, priority: e.target.value })
                  }
                >
                  <NativeSelectOption value="">
                    Todas as importâncias
                  </NativeSelectOption>
                  {Object.entries(priorities).map(([v, label]) => (
                    <NativeSelectOption key={v} value={v}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="task-field">
                <Label htmlFor="filter-from">Prazo de</Label>
                <Input
                  id="filter-from"
                  type="date"
                  min="1000-01-01"
                  max="9999-12-31"
                  value={draft.dueFrom}
                  aria-describedby={filterError ? 'filter-error' : undefined}
                  onChange={(e) =>
                    setDraft({ ...draft, dueFrom: e.target.value })
                  }
                />
              </div>
              <div className="task-field">
                <Label htmlFor="filter-to">Prazo até</Label>
                <Input
                  id="filter-to"
                  type="date"
                  min="1000-01-01"
                  max="9999-12-31"
                  value={draft.dueTo}
                  aria-describedby={filterError ? 'filter-error' : undefined}
                  onChange={(e) =>
                    setDraft({ ...draft, dueTo: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="task-actions">
              <Button type="submit">Aplicar filtros</Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setDraft({
                    status: '',
                    priority: '',
                    dueFrom: '',
                    dueTo: '',
                  });
                  setFilters({ ...initialFilters });
                  setFilterError('');
                }}
              >
                Limpar filtros
              </Button>
            </div>
            {filterError && (
              <Alert variant="destructive" id="filter-error" role="alert">
                <AlertDescription>{filterError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </form>
      </Card>
      {loading && (
        <div className="task-loading">
          <Skeleton aria-hidden="true" className="h-5 w-2/3" />
          <Skeleton aria-hidden="true" className="h-16 w-full" />
          <p role="status">Carregando tarefas…</p>
        </div>
      )}
      {detailLoading && (
        <div className="task-loading">
          <Skeleton aria-hidden="true" className="h-5 w-2/3" />
          <Skeleton aria-hidden="true" className="h-16 w-full" />
          <p role="status">Carregando detalhe…</p>
        </div>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            <p>{error}</p>
            <Button type="button" onClick={refresh}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {detail && (
        <Card asChild>
          <section
            className="task-card task-detail"
            aria-labelledby="task-detail-heading"
          >
            <CardHeader>
              <TaskBadges task={detail} />
              <h2 id="task-detail-heading" ref={detailHeading} tabIndex={-1}>
                {detail.title}
              </h2>
            </CardHeader>
            <CardContent>
              <TaskProgress task={detail} />
              <p className="task-description">
                {detail.description || 'Sem descrição'}
              </p>
              <dl className="task-metadata">
                {subjectsEnabled && (
                  <>
                    <div>
                      <dt>Matéria</dt>
                      <dd>
                        {detail.subjectId
                          ? subjectName || 'Carregando matéria…'
                          : 'Sem matéria'}
                      </dd>
                    </div>
                  </>
                )}
                <div>
                  <dt>Status</dt>
                  <dd>{statuses[detail.status]}</dd>
                </div>
                <div>
                  <dt>Importância</dt>
                  <dd>{priorities[detail.priority]}</dd>
                </div>
                <div>
                  <dt>Prazo</dt>
                  <dd>
                    {detail.dueDate ? dateLabel(detail.dueDate) : 'Sem prazo'}
                  </dd>
                </div>
                <div>
                  <dt>Criada em</dt>
                  <dd>{new Date(detail.createdAt).toLocaleString('pt-BR')}</dd>
                </div>
                <div>
                  <dt>Atualizada em</dt>
                  <dd>{new Date(detail.updatedAt).toLocaleString('pt-BR')}</dd>
                </div>
              </dl>
              <div className="task-actions">
                <Button
                  type="button"
                  onClick={() => {
                    setSuccess('');
                    setEditor({ task: detail });
                  }}
                >
                  <Pencil aria-hidden="true" /> Editar tarefa
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setSuccess('');
                    setDeleting(detail);
                  }}
                >
                  <Trash2 aria-hidden="true" /> Excluir tarefa
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setDetail(null);
                    newButton.current?.focus();
                  }}
                >
                  <X aria-hidden="true" /> Fechar detalhe
                </Button>
              </div>
              {!editor && (
                <SubtasksSection
                  key={detail.id}
                  task={detail}
                  onTaskChanged={onSubtasksChanged}
                />
              )}
            </CardContent>
          </section>
        </Card>
      )}
      {result && (
        <section className="tasks-results" aria-label="Lista de tarefas">
          <div className="tasks-results-heading">
            <h2>{filtered ? 'Resultados dos filtros' : 'Suas tarefas'}</h2>
            <span className="task-count">{result.total} tarefa(s)</span>
          </div>
          {result.items.length === 0 ? (
            filtered ? (
              <div className="task-empty">
                <ClipboardList aria-hidden="true" />
                <p>
                  Nenhum resultado para estes filtros. Limpe os filtros para ver
                  suas tarefas.
                </p>
              </div>
            ) : !loading && !error && result.total === 0 ? (
              <CollectionEmptyState
                icon={<ClipboardList />}
                title="Nenhuma tarefa ainda"
                description="Crie sua primeira tarefa para começar a organizar o que precisa estudar."
                actionLabel="Adicionar tarefa"
                onAction={createTask}
              />
            ) : null
          ) : (
            <ul className="task-list">
              {result.items.map((task) => (
                <Card key={task.id} asChild>
                  <li
                    className="task-card task-list-card"
                    data-status={task.status}
                    data-priority={task.priority}
                  >
                    <CardHeader>
                      <TaskBadges task={task} />
                      <h3>{task.title}</h3>
                    </CardHeader>
                    <CardContent>
                      {task.description && (
                        <p className="task-card-description">
                          {task.description}
                        </p>
                      )}
                      <p className="task-deadline">
                        <CalendarDays aria-hidden="true" />
                        {task.dueDate
                          ? `Prazo: ${dateLabel(task.dueDate)}`
                          : 'Sem prazo'}
                      </p>
                      <div className="task-card-footer">
                        <TaskProgress task={task} />
                        <Button
                          type="button"
                          disabled={detailLoading}
                          variant="outline"
                          aria-label={`Ver detalhes de ${task.title}`}
                          className="task-detail-link"
                          onClick={async () => {
                            setDetailLoading(true);
                            setSuccess('');
                            setError('');
                            setDetail(null);
                            setEditor(null);
                            try {
                              setDetail(await taskDetail(task.id));
                            } catch (cause) {
                              setError(failure(cause));
                            } finally {
                              setDetailLoading(false);
                            }
                          }}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </li>
                </Card>
              ))}
            </ul>
          )}
          <Pagination
            className="task-actions task-pagination"
            aria-label="Paginação de tarefas"
          >
            <PaginationContent className="flex-wrap">
              <PaginationItem>
                <Button
                  aria-label="Página anterior"
                  type="button"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
              </PaginationItem>
              <PaginationItem>
                <span>
                  Página {result.page} de {Math.max(1, result.totalPages)} ·{' '}
                  {result.total} tarefa(s)
                </span>
              </PaginationItem>
              <PaginationItem>
                <Button
                  aria-label="Próxima página"
                  type="button"
                  disabled={filters.page >= result.totalPages}
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </section>
      )}
      {deleting && (
        <DeleteConfirmation
          task={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setDetail(null);
            setEditor(null);
            setSuccess('Tarefa excluída.');
            setFilters({
              ...filters,
              page: Math.max(
                1,
                result?.items.length === 1 ? filters.page - 1 : filters.page,
              ),
            });
            newButton.current?.focus();
          }}
        />
      )}
    </div>
  );
}
