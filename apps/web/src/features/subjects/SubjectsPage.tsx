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
    <form
      className="subject-card"
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
      <h2>{subject ? 'Editar matéria' : 'Nova matéria'}</h2>
      <fieldset disabled={busy}>
        <label>
          Nome
          <input
            ref={first}
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Nível atual
          <select
            value={currentLevel}
            onChange={(event) =>
              setLevel(event.target.value as StudySubject['currentLevel'])
            }
          >
            {Object.entries(levels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Objetivo
          <textarea
            required
            maxLength={1000}
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
          />
        </label>
        <label>
          Prazo
          <input
            required
            type="date"
            min="1000-01-01"
            max="9999-12-31"
            value={dueDate}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <label>
          Horas por semana
          <input
            required
            type="number"
            min="0.5"
            max="168"
            step="0.5"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
          />
        </label>
        <label>
          Assuntos conhecidos (um por linha, opcional)
          <textarea
            value={topics}
            onChange={(event) => setTopics(event.target.value)}
          />
        </label>
        <div className="subject-actions">
          <button>{busy ? 'Salvando…' : 'Salvar matéria'}</button>
          <button type="button" onClick={onCancel}>
            Cancelar edição
          </button>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
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
    <section aria-label="Plano manual">
      <h3>Plano manual</h3>
      <form
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
        <label>
          Assunto a estudar
          <input
            value={title}
            maxLength={160}
            required
            disabled={busy}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <button disabled={busy}>
          {editing ? 'Salvar assunto' : 'Adicionar assunto'}
        </button>
        {editing && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setEditing(null);
              setTitle('');
            }}
          >
            Cancelar alteração
          </button>
        )}
      </form>
      {error && <p role="alert">{error}</p>}
      {busy && <p role="status">Salvando plano…</p>}
      {!subject.planItems.length && (
        <p>Seu plano está vazio. Adicione o primeiro assunto.</p>
      )}
      <ol>
        {subject.planItems.map((item, index) => (
          <li key={item.id}>
            <h4>{item.title}</h4>
            <label>
              Status de {item.title}
              <select
                disabled={busy}
                value={item.status}
                onChange={(event) =>
                  void mutate(`/${item.id}`, 'PATCH', {
                    status: event.target.value,
                  })
                }
              >
                {Object.entries(statuses).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div className="subject-actions">
              <button
                disabled={busy}
                onClick={() => {
                  setEditing(item);
                  setTitle(item.title);
                }}
              >
                Renomear {item.title}
              </button>
              <button
                disabled={busy || index === 0}
                onClick={() => move(index, -1)}
              >
                Subir {item.title}
              </button>
              <button
                disabled={busy || index === subject.planItems.length - 1}
                onClick={() => move(index, 1)}
              >
                Descer {item.title}
              </button>
              <button
                disabled={busy}
                onClick={() => void mutate(`/${item.id}`, 'DELETE', {})}
              >
                Remover {item.title}
              </button>
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
    <section>
      <h3>Registros vinculados recentes</h3>
      {busy && <p role="status">Carregando registros…</p>}
      {error && <p role="alert">{error}</p>}
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
  return (
    <div className="subjects-page">
      <p>Organize objetivos e assuntos no seu ritmo.</p>
      <button
        ref={newButton}
        onClick={() => {
          setEditor({ subject: null });
          setDetail(null);
          setSuccess('');
        }}
      >
        Criar matéria
      </button>
      {loading && <p role="status">Carregando matérias…</p>}
      {busy && <p role="status">Carregando ação…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => setRevision(revision + 1)}>
            Tentar novamente
          </button>
        </div>
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
        <section className="subject-card">
          <h2 ref={heading} tabIndex={-1}>
            {detail.name}
          </h2>
          <p>{detail.objective}</p>
          <dl>
            <dt>Nível</dt>
            <dd>{levels[detail.currentLevel]}</dd>
            <dt>Prazo</dt>
            <dd>{detail.dueDate}</dd>
            <dt>Horas semanais</dt>
            <dd>{detail.weeklyHours}</dd>
          </dl>
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
          <div className="subject-actions">
            <button
              disabled={busy}
              onClick={() => {
                setSuccess('');
                setEditor({ subject: detail });
              }}
            >
              Editar matéria
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setSuccess('');
                setDeleting(true);
              }}
            >
              Excluir matéria
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setDetail(null);
                setDeleting(false);
                newButton.current?.focus();
              }}
            >
              Fechar detalhe
            </button>
          </div>
          {deleting && (
            <div role="group" aria-label="Confirmar exclusão">
              <p>
                Excluir {detail.name} e seu plano? Tarefas e sessões serão
                preservadas.
              </p>
              <button
                autoFocus
                disabled={busy}
                onClick={() => setDeleting(false)}
              >
                Cancelar exclusão
              </button>
              <button
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
              </button>
            </div>
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
        </section>
      )}
      {result && (
        <section aria-label="Lista de matérias">
          {!result.items.length ? (
            <p>Você ainda não tem matérias. Use Criar matéria para começar.</p>
          ) : (
            <ul className="subject-list">
              {result.items.map((subject) => (
                <li className="subject-card" key={subject.id}>
                  <h2>{subject.name}</h2>
                  <p>
                    {levels[subject.currentLevel]} · {subject.weeklyHours} horas
                    por semana
                  </p>
                  <button
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
                  </button>
                </li>
              ))}
            </ul>
          )}
          {result.totalPages > 1 && (
            <nav aria-label="Páginas de matérias">
              <button
                disabled={page === 1 || busy}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span>
                Página {page} de {result.totalPages}
              </span>
              <button
                disabled={page >= result.totalPages || busy}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </section>
      )}
    </div>
  );
}
