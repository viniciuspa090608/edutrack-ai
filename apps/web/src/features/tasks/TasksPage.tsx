import { useEffect, useRef, useState } from 'react';
import { createTaskSchema, taskFiltersSchema } from '@study-platform/contracts';
import type {
  StudyTask,
  TaskFilters,
  TaskList,
} from '@study-platform/contracts';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import { deleteTask, listTasks, saveTask, taskDetail } from './tasks-api.js';
import '../../styles/tasks.css';

const statuses = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
};
const priorities = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };
const initialFilters: TaskFilters = { page: 1, pageSize: 20 };
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
}: {
  task: StudyTask | null;
  onSaved: (task: StudyTask) => void;
  onCancel: () => void;
}) {
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
    <form
      className="task-card task-form"
      aria-label={task ? 'Editar tarefa' : 'Criar tarefa'}
      noValidate
      onSubmit={async (event) => {
        event.preventDefault();
        if (submitting.current) return;
        const parsed = createTaskSchema.safeParse({
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
          onSaved(await saveTask(task?.id ?? null, parsed.data));
        } catch (cause) {
          setError(failure(cause));
        } finally {
          submitting.current = false;
          setBusy(false);
        }
      }}
    >
      <h2>{task ? 'Editar tarefa' : 'Nova tarefa'}</h2>
      <fieldset disabled={busy}>
        <label htmlFor="task-title">Título</label>
        <input
          ref={titleRef}
          id="task-title"
          value={title}
          maxLength={160}
          required
          aria-invalid={!!invalid.title}
          aria-describedby={invalid.title ? 'task-title-error' : undefined}
          onChange={(event) => setTitle(event.target.value)}
        />
        {invalid.title && <p id="task-title-error">{invalid.title}</p>}
        <label htmlFor="task-description">Descrição (opcional)</label>
        <textarea
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
        <label htmlFor="task-priority">Importância</label>
        <select
          id="task-priority"
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value as StudyTask['priority'])
          }
        >
          {Object.entries(priorities).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="task-dueDate">Prazo (opcional)</label>
        <input
          id="task-dueDate"
          type="date"
          min="1000-01-01"
          max="9999-12-31"
          value={dueDate}
          aria-invalid={!!invalid.dueDate}
          aria-describedby={invalid.dueDate ? 'task-dueDate-error' : undefined}
          onChange={(event) => setDueDate(event.target.value)}
        />
        {invalid.dueDate && <p id="task-dueDate-error">{invalid.dueDate}</p>}
        <label htmlFor="task-status">Status</label>
        <select
          id="task-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as StudyTask['status'])
          }
        >
          {Object.entries(statuses).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="task-actions">
          <button type="submit">{busy ? 'Salvando…' : 'Salvar tarefa'}</button>
          <button type="button" onClick={onCancel}>
            Cancelar edição
          </button>
        </div>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  useEffect(() => {
    const element = dialog.current!;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
      else document.getElementById('task-create')?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="task-dialog"
      aria-labelledby="delete-heading"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="delete-heading">Excluir tarefa?</h2>
      <p id="delete-description">
        “{task.title}” será removida permanentemente.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="task-actions">
        <button type="button" autoFocus disabled={busy} onClick={onClose}>
          Cancelar exclusão
        </button>
        <button
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
        </button>
      </div>
    </dialog>
  );
}

export function TasksPage() {
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
    if (detail) detailHeading.current?.focus();
  }, [detail]);
  const filtered = !!(
    filters.status ||
    filters.priority ||
    filters.dueFrom ||
    filters.dueTo
  );
  const refresh = () => setRevision((value) => value + 1);
  return (
    <div className="tasks-page">
      <p>Organize seus estudos com prazos e status manuais.</p>
      <button
        ref={newButton}
        id="task-create"
        type="button"
        onClick={() => {
          setEditor({ task: null });
          setDetail(null);
          setSuccess('');
        }}
      >
        Criar tarefa
      </button>
      {success && <p role="status">{success}</p>}
      {editor && (
        <TaskForm
          key={editor.task?.id ?? 'new'}
          task={editor.task}
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
      )}
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
        <h2>Filtros</h2>
        <label htmlFor="filter-status">Filtrar por status</label>
        <select
          id="filter-status"
          value={draft.status}
          onChange={(e) => setDraft({ ...draft, status: e.target.value })}
        >
          <option value="">Todos os status</option>
          {Object.entries(statuses).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="filter-priority">Filtrar por importância</label>
        <select
          id="filter-priority"
          value={draft.priority}
          onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
        >
          <option value="">Todas as importâncias</option>
          {Object.entries(priorities).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="filter-from">Prazo de</label>
        <input
          id="filter-from"
          type="date"
          min="1000-01-01"
          max="9999-12-31"
          value={draft.dueFrom}
          aria-describedby={filterError ? 'filter-error' : undefined}
          onChange={(e) => setDraft({ ...draft, dueFrom: e.target.value })}
        />
        <label htmlFor="filter-to">Prazo até</label>
        <input
          id="filter-to"
          type="date"
          min="1000-01-01"
          max="9999-12-31"
          value={draft.dueTo}
          aria-describedby={filterError ? 'filter-error' : undefined}
          onChange={(e) => setDraft({ ...draft, dueTo: e.target.value })}
        />
        <div className="task-actions">
          <button type="submit">Aplicar filtros</button>
          <button
            type="button"
            onClick={() => {
              setDraft({ status: '', priority: '', dueFrom: '', dueTo: '' });
              setFilters({ ...initialFilters });
              setFilterError('');
            }}
          >
            Limpar filtros
          </button>
        </div>
        {filterError && (
          <p id="filter-error" role="alert">
            {filterError}
          </p>
        )}
      </form>
      {loading && <p role="status">Carregando tarefas…</p>}
      {detailLoading && <p role="status">Carregando detalhe…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={refresh}>
            Tentar novamente
          </button>
        </div>
      )}
      {detail && (
        <section className="task-card" aria-labelledby="task-detail-heading">
          <h2 id="task-detail-heading" ref={detailHeading} tabIndex={-1}>
            {detail.title}
          </h2>
          <p className="task-description">
            {detail.description || 'Sem descrição'}
          </p>
          <dl>
            <dt>Status</dt>
            <dd>{statuses[detail.status]}</dd>
            <dt>Importância</dt>
            <dd>{priorities[detail.priority]}</dd>
            <dt>Prazo</dt>
            <dd>{detail.dueDate ? dateLabel(detail.dueDate) : 'Sem prazo'}</dd>
            <dt>Criada em</dt>
            <dd>{new Date(detail.createdAt).toLocaleString('pt-BR')}</dd>
            <dt>Atualizada em</dt>
            <dd>{new Date(detail.updatedAt).toLocaleString('pt-BR')}</dd>
          </dl>
          <div className="task-actions">
            <button
              type="button"
              onClick={() => {
                setSuccess('');
                setEditor({ task: detail });
              }}
            >
              Editar tarefa
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccess('');
                setDeleting(detail);
              }}
            >
              Excluir tarefa
            </button>
            <button
              type="button"
              onClick={() => {
                setDetail(null);
                newButton.current?.focus();
              }}
            >
              Fechar detalhe
            </button>
          </div>
        </section>
      )}
      {result && (
        <section aria-label="Lista de tarefas">
          {result.items.length === 0 ? (
            <p>
              {filtered
                ? 'Nenhum resultado para estes filtros. Limpe os filtros para ver suas tarefas.'
                : 'Você ainda não tem tarefas. Use Criar tarefa para começar.'}
            </p>
          ) : (
            <ul className="task-list">
              {result.items.map((task) => (
                <li key={task.id} className="task-card">
                  <h2>{task.title}</h2>
                  <p>
                    {statuses[task.status]} · Importância{' '}
                    {priorities[task.priority].toLowerCase()} ·{' '}
                    {task.dueDate
                      ? `Prazo: ${dateLabel(task.dueDate)}`
                      : 'Sem prazo'}
                  </p>
                  <button
                    type="button"
                    disabled={detailLoading}
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
                    Ver detalhes de {task.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <nav className="task-actions" aria-label="Paginação de tarefas">
            <button
              type="button"
              disabled={filters.page <= 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              Página anterior
            </button>
            <span>
              Página {result.page} de {Math.max(1, result.totalPages)} ·{' '}
              {result.total} tarefa(s)
            </span>
            <button
              type="button"
              disabled={filters.page >= result.totalPages}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Próxima página
            </button>
          </nav>
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
