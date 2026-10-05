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
import { Input } from '@study-platform/ui/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';
import { Textarea } from '@study-platform/ui/components/ui/textarea';
import { Button } from '@study-platform/ui/components/ui/button';
import { Badge } from '@study-platform/ui/components/ui/badge';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  ListChecks,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';

import { useEffect, useRef, useState } from 'react';
import {
  createSubjectSchema,
  createPlanItemSchema,
} from '@study-platform/contracts';
import type {
  StudySubject,
  SubjectList,
  PlanItem,
} from '@study-platform/contracts';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import { listTasks } from '../tasks/tasks-api.js';
import { pomodoroHistory } from '../pomodoro/pomodoro-api.js';
import {
  listSubjects,
  subjectDetail,
  saveSubject,
  deleteSubject,
  mutatePlan,
} from './subjects-api.js';
import '../../styles/subjects.css';
import { RoadmapsSection } from './RoadmapsSection.js';
import { CollectionEmptyState } from '../../components/CollectionEmptyState.js';
const levels = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};
const statuses = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
};
function failure(cause: unknown) {
  if (cause instanceof AuthApiError && cause.status === 401) {
    navigate('/acesso?returnTo=%2Fapp%2Fmaterias');
    return 'Entre novamente para continuar.';
  }
  return cause instanceof AuthApiError && cause.code === 'MODULE_DISABLED'
    ? 'Reative matérias nas preferências.'
    : 'Não foi possível concluir a ação. Tente novamente.';
}
function SubjectForm({
  subject,
  onSaved,
  onCancel,
}: {
  subject: StudySubject | null;
  onSaved: (subject: StudySubject) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(subject?.name ?? '');
  const [currentLevel, setLevel] = useState(
    subject?.currentLevel ?? 'BEGINNER',
  );
  const [objective, setObjective] = useState(subject?.objective ?? '');
  const [dueDate, setDate] = useState(subject?.dueDate ?? '');
  const [hours, setHours] = useState(String(subject?.weeklyHours ?? 1));
  const [topics, setTopics] = useState(subject?.knownTopics.join('\n') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  useEffect(() => {
    first.current?.focus();
  }, []);
  return (
    <Card asChild>
      <form
        className="subject-card subject-form"
        aria-label={subject ? 'Editar matéria' : 'Criar matéria'}
        onSubmit={async (event) => {
          event.preventDefault();
          if (submitting.current) return;
          const parsed = createSubjectSchema.safeParse({
            name,
            currentLevel,
            objective,
            dueDate,
            weeklyHours: Number(hours),
            knownTopics: topics === '' ? [] : topics.split('\n'),
          });
          if (!parsed.success) {
            setError(
              'Revise os campos: nome até 120 caracteres, objetivo até 1000, data válida, horas em intervalos de meia hora e assuntos não vazios sem repetição.',
            );
            return;
          }
          submitting.current = true;
          setBusy(true);
          setError('');
          try {
            onSaved(await saveSubject(subject?.id ?? null, parsed.data));
          } catch (cause) {
            setError(failure(cause));
          } finally {
            setBusy(false);
            submitting.current = false;
          }
        }}
      >
        <CardHeader>
          <span className="subject-eyebrow">Seu planejamento</span>
          <h2>{subject ? 'Editar matéria' : 'Nova matéria'}</h2>
          <p>Defina seu objetivo e o tempo disponível para estudar.</p>
        </CardHeader>
        <CardContent>
          <FieldSet disabled={busy} className="subject-form-fields">
            <Label>
              Nome
              <Input
                ref={first}
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Label>
            <Label>
              Nível atual
              <NativeSelect
                value={currentLevel}
                onChange={(event) =>
                  setLevel(event.target.value as StudySubject['currentLevel'])
                }
              >
                {Object.entries(levels).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Label>
            <Label className="subject-field-wide">
              Objetivo
              <Textarea
                required
                maxLength={1000}
                value={objective}
                onChange={(event) => setObjective(event.target.value)}
              />
            </Label>
            <Label>
              Prazo
              <Input
                required
                type="date"
                min="1000-01-01"
                max="9999-12-31"
                value={dueDate}
                onChange={(event) => setDate(event.target.value)}
              />
            </Label>
            <Label>
              Horas por semana
              <Input
                required
                type="number"
                min="0.5"
                max="168"
                step="0.5"
                value={hours}
                onChange={(event) => setHours(event.target.value)}
              />
            </Label>
            <Label className="subject-field-wide">
              Assuntos conhecidos (um por linha, opcional)
              <Textarea
                value={topics}
                onChange={(event) => setTopics(event.target.value)}
              />
            </Label>
            <div className="subject-actions subject-field-wide">
              <Button>{busy ? 'Salvando…' : 'Salvar matéria'}</Button>
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
function PlanEditor({
  subject,
  onChanged,
  onActionStart,
}: {
  subject: StudySubject;
  onChanged: (value: StudySubject) => void;
  onActionStart: () => void;
}) {
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  async function mutate(
    path: string,
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    body: object,
  ) {
    if (pending.current) return;
    pending.current = true;
    onActionStart();
    setBusy(true);
    setError('');
    try {
      onChanged(await mutatePlan(subject.id, path, method, body));
      if (method === 'POST' || (method === 'PATCH' && editing)) {
        setTitle('');
        setEditing(null);
      }
    } catch (cause) {
      setError(failure(cause));
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  function move(index: number, offset: number) {
    const ids = subject.planItems.map((item) => item.id);
    [ids[index], ids[index + offset]] = [ids[index + offset]!, ids[index]!];
    void mutate('/order', 'PUT', { ids });
  }
  return (
    <section className="subject-panel subject-plan" aria-label="Plano manual">
      <h3>
        <ListChecks aria-hidden="true" />
        Plano manual
      </h3>
      <form
        className="subject-plan-form"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = createPlanItemSchema.safeParse({ title });
          if (!parsed.success) {
            setError('Use um título de 1 a 160 caracteres.');
            return;
          }
          void mutate(
            editing ? `/${editing.id}` : '',
            editing ? 'PATCH' : 'POST',
            { title: parsed.data.title },
          );
        }}
      >
        <Label>
          Assunto a estudar
          <Input
            value={title}
            maxLength={160}
            required
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Label>
        <Button disabled={busy}>
          {editing ? 'Salvar assunto' : 'Adicionar assunto'}
        </Button>
        {editing && (
          <Button
            variant="outline"
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(null);
              setTitle('');
            }}
          >
            Cancelar alteração
          </Button>
        )}
      </form>
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {busy && <p role="status">Salvando plano…</p>}
      {!subject.planItems.length && (
        <p className="subject-empty">
          Seu plano está vazio. Adicione o primeiro assunto.
        </p>
      )}
      <ol>
        {subject.planItems.map((item, index) => (
          <li
            key={item.id}
            className="subject-plan-item"
            data-status={item.status}
          >
            <h4>{item.title}</h4>
            <Label>
              Status de {item.title}
              <NativeSelect
                disabled={busy}
                value={item.status}
                onChange={(event) =>
                  void mutate(`/${item.id}`, 'PATCH', {
                    status: event.target.value,
                  })
                }
              >
                {Object.entries(statuses).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Label>
            <div className="subject-actions">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditing(item);
                  setTitle(item.title);
                }}
              >
                Renomear {item.title}
              </Button>
              <Button
                variant="ghost"
                disabled={busy || index === 0}
                onClick={() => move(index, -1)}
              >
                Subir {item.title}
              </Button>
              <Button
                variant="ghost"
                disabled={busy || index === subject.planItems.length - 1}
                onClick={() => move(index, 1)}
              >
                Descer {item.title}
              </Button>
              <Button
                variant="ghost"
                className="subject-danger"
                disabled={busy}
                onClick={() => void mutate(`/${item.id}`, 'DELETE', {})}
              >
                Remover {item.title}
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
function LinkedRecords({
  subjectId,
  tasksEnabled,
}: {
  subjectId: string;
  tasksEnabled: boolean;
}) {
  const [taskNames, setTasks] = useState<string[]>([]);
  const [sessions, setSessions] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    void Promise.all([
      tasksEnabled
        ? listTasks({ subjectId, page: 1, pageSize: 100 })
        : Promise.resolve(null),
      pomodoroHistory(1, subjectId),
    ])
      .then(([tasks, history]) => {
        if (active) {
          setTasks(tasks?.items.map((task) => task.title) ?? []);
          setSessions(
            history.items.map(
              (session) =>
                `${session.activeSeconds} segundos · ${session.completedBlocks} blocos`,
            ),
          );
        }
      })
      .catch(() => {
        if (active)
          setError('Não foi possível carregar os registros vinculados.');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [subjectId, tasksEnabled]);
  return (
    <section className="subject-panel subject-linked">
      <h3>Registros vinculados recentes</h3>
      {busy && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando registros…</p>
        </div>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!busy && !error && (
        <>
          {tasksEnabled && (
            <>
              <h4>Tarefas</h4>
              {taskNames.length ? (
                <ul>
                  {taskNames.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma tarefa vinculada.</p>
              )}
              <a href="/app/tarefas">Abrir tarefas</a>
            </>
          )}
          <h4>Sessões encerradas</h4>
          {sessions.length ? (
            <ul>
              {sessions.map((value, index) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma sessão vinculada.</p>
          )}
          <a href="/app/pomodoro">Abrir Pomodoro</a>
        </>
      )}
    </section>
  );
}
export function SubjectsPage({
  tasksEnabled = false,
  aiEnabled = false,
}: {
  tasksEnabled?: boolean;
  aiEnabled?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<SubjectList | null>(null);
  const [detail, setDetail] = useState<StudySubject | null>(null);
  const [editor, setEditor] = useState<{ subject: StudySubject | null } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleting, setDeleting] = useState(false);
  const newButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('subject');
    if (!id) return;
    let active = true;
    void subjectDetail(id)
      .then((value) => {
        if (active) setDetail(value);
      })
      .catch((cause) => {
        if (active) setError(failure(cause));
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setResult(null);
    void listSubjects(page)
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
  }, [page, revision]);
  useEffect(() => {
    if (detail && !editor) heading.current?.focus();
  }, [detail?.id, !!editor]);
  const saved = (value: StudySubject) => {
    setDetail(value);
    setEditor(null);
    setSuccess('Matéria salva.');
    setRevision(revision + 1);
  };
  const createSubject = () => {
    setEditor({ subject: null });
    setDetail(null);
    setSuccess('');
  };
  return (
    <div className="subjects-page">
      <div className="subjects-toolbar">
        <p>Organize objetivos e assuntos no seu ritmo.</p>
        <Button ref={newButton} onClick={createSubject}>
          <Plus aria-hidden="true" />
          Criar matéria
        </Button>
      </div>
      {loading && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando matérias…</p>
        </div>
      )}
      {busy && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando ação…</p>
        </div>
      )}
      {error && !deleting && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            <p>{error}</p>
            <Button onClick={() => setRevision(revision + 1)}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {success && <p role="status">{success}</p>}
      {editor && (
        <SubjectForm
          key={editor.subject?.id ?? 'new'}
          subject={editor.subject}
          onSaved={saved}
          onCancel={() => {
            setEditor(null);
            newButton.current?.focus();
          }}
        />
      )}
      {detail && (
        <Card asChild>
          <section className="subject-card subject-detail">
            <CardHeader>
              <span className="subject-eyebrow">Sua matéria</span>
              <h2 ref={heading} tabIndex={-1}>
                {detail.name}
              </h2>
            </CardHeader>
            <CardContent>
              <p className="subject-objective">{detail.objective}</p>
              <dl className="subject-metadata">
                <div>
                  <dt>Nível</dt>
                  <dd>{levels[detail.currentLevel]}</dd>
                </div>
                <div>
                  <dt>Prazo</dt>
                  <dd>{detail.dueDate}</dd>
                </div>
                <div>
                  <dt>Horas semanais</dt>
                  <dd>{detail.weeklyHours}</dd>
                </div>
              </dl>
              <section className="subject-known">
                <h3>Assuntos conhecidos</h3>
                {detail.knownTopics.length ? (
                  <ul>
                    {detail.knownTopics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhum assunto conhecido informado.</p>
                )}
              </section>
              <div className="subject-actions">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setSuccess('');
                    setEditor({ subject: detail });
                  }}
                >
                  <Pencil aria-hidden="true" />
                  Editar matéria
                </Button>
                <Button
                  variant="outline"
                  className="subject-danger"
                  disabled={busy}
                  onClick={() => {
                    setSuccess('');
                    setDeleting(true);
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  Excluir matéria
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setDetail(null);
                    setDeleting(false);
                    newButton.current?.focus();
                  }}
                >
                  Fechar detalhe
                </Button>
              </div>
              {deleting && (
                <AlertDialog
                  open
                  onOpenChange={(open) => {
                    if (!open && !busy) setDeleting(false);
                  }}
                >
                  <AlertDialogContent
                    className="subject-dialog"
                    onEscapeKeyDown={(event) => {
                      event.preventDefault();
                      if (!busy) setDeleting(false);
                    }}
                    onCloseAutoFocus={(event) => {
                      event.preventDefault();
                      newButton.current?.focus();
                    }}
                  >
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <div role="group" aria-label="Confirmar exclusão">
                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                      <AlertDialogDescription asChild>
                        <p>
                          Excluir {detail.name} e seu plano? Tarefas e sessões
                          serão preservadas.
                        </p>
                      </AlertDialogDescription>
                      <Button
                        variant="outline"
                        autoFocus
                        disabled={busy}
                        onClick={() => setDeleting(false)}
                      >
                        Cancelar exclusão
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          setError('');
                          setSuccess('');
                          try {
                            await deleteSubject(detail.id);
                            setDetail(null);
                            setDeleting(false);
                            setPage(1);
                            setRevision(revision + 1);
                            setSuccess('Matéria excluída.');
                            newButton.current?.focus();
                          } catch (cause) {
                            setError(failure(cause));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Confirmar exclusão
                      </Button>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {!editor && (
                <>
                  <RoadmapsSection
                    key={`roadmaps-${detail.id}`}
                    subject={detail}
                    aiEnabled={aiEnabled}
                  />
                  <PlanEditor
                    key={detail.id}
                    subject={detail}
                    onActionStart={() => setSuccess('')}
                    onChanged={(value) => {
                      setDetail(value);
                      setSuccess('Plano salvo.');
                      setRevision(revision + 1);
                    }}
                  />
                  <LinkedRecords
                    subjectId={detail.id}
                    tasksEnabled={tasksEnabled}
                  />
                </>
              )}
            </CardContent>
          </section>
        </Card>
      )}
      {result && (
        <section className="subjects-collection" aria-label="Lista de matérias">
          {!result.items.length ? (
            !loading && !error && result.total === 0 ? (
              <CollectionEmptyState
                icon={<BookOpen />}
                title="Nenhuma matéria ainda"
                description="Adicione sua primeira matéria para começar a organizar seus estudos."
                actionLabel="Adicionar matéria"
                onAction={createSubject}
              />
            ) : null
          ) : (
            <ul className="subject-list">
              {result.items.map((subject) => (
                <Card key={subject.id} asChild>
                  <li className="subject-card subject-summary">
                    <CardHeader className="subject-summary-heading">
                      <span className="subject-icon">
                        <BookOpen aria-hidden="true" />
                      </span>
                      <h2>{subject.name}</h2>
                      <Badge variant="secondary">
                        {levels[subject.currentLevel]}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="subject-objective">{subject.objective}</p>
                      <div className="subject-summary-meta">
                        <span>
                          <Clock3 aria-hidden="true" />
                          {subject.weeklyHours} horas por semana
                        </span>
                        <span>
                          <CalendarDays aria-hidden="true" />
                          Prazo: {subject.dueDate}
                        </span>
                      </div>
                      <Button
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          setError('');
                          setSuccess('');
                          setEditor(null);
                          setDetail(null);
                          setDeleting(false);
                          try {
                            setDetail(await subjectDetail(subject.id));
                          } catch (cause) {
                            setError(failure(cause));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Ver {subject.name}
                        <ArrowRight aria-hidden="true" />
                      </Button>
                    </CardContent>
                  </li>
                </Card>
              ))}
            </ul>
          )}
          {result.totalPages > 1 && (
            <Pagination aria-label="Páginas de matérias">
              <PaginationContent className="flex-wrap">
                <PaginationItem>
                  <Button
                    variant="outline"
                    disabled={page === 1 || busy}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span>
                    Página {page} de {result.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    disabled={page >= result.totalPages || busy}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </section>
      )}
    </div>
  );
}
