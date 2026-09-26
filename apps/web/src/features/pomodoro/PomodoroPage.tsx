import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  PomodoroAction,
  PomodoroSession,
} from '@study-platform/contracts';
import {
  currentPomodoro,
  pomodoroHistory,
  pomodoroSummary,
  startPomodoro,
  commandPomodoro,
} from './pomodoro-api.js';
import { listTasks } from '../tasks/tasks-api.js';
import '../../styles/pomodoro.css';
import { SubjectSelect } from '../subjects/SubjectSelect.js';
import { SubjectName } from '../subjects/SubjectName.js';

const format = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
export function PomodoroPage({
  tasksEnabled,
  subjectsEnabled = false,
}: {
  tasksEnabled: boolean;
  subjectsEnabled?: boolean;
}) {
  const [subjectId, setSubjectId] = useState('');
  const [historySubject, setHistorySubject] = useState('');
  const [session, setSession] = useState<PomodoroSession | null>(null);
  const [history, setHistory] = useState<Awaited<
    ReturnType<typeof pomodoroHistory>
  > | null>(null);
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof pomodoroSummary>
  > | null>(null);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);
  const [taskPage, setTaskPage] = useState(1);
  const [taskPages, setTaskPages] = useState(0);
  const [taskId, setTaskId] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [tick, setTick] = useState(0);
  const receivedAt = useRef(performance.now());
  const readVersion = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const accept = useCallback((value: PomodoroSession | null) => {
    receivedAt.current = performance.now();
    setSession(value);
    setTick(0);
  }, []);
  const refresh = useCallback(async () => {
    const version = ++readVersion.current;
    const value = await currentPomodoro();
    if (version !== readVersion.current) return;
    accept(value);
    setReady(true);
    const [items, totals] = await Promise.all([
      pomodoroHistory(
        page,
        subjectsEnabled && historySubject ? historySubject : undefined,
      ),
      pomodoroSummary(),
    ]);
    if (version !== readVersion.current) return;
    setHistory(items);
    setSummary(totals);
  }, [page, accept, subjectsEnabled, historySubject]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    void refresh()
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar o Pomodoro. Tente novamente.');
          setReady(false);
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    const visibility = () => {
      if (document.visibilityState === 'visible')
        void refresh().catch(() => {
          setError('Não foi possível sincronizar. Tente novamente.');
          setReady(false);
        });
    };
    window.addEventListener('focus', visibility);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false;
      readVersion.current += 1;
      window.removeEventListener('focus', visibility);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [refresh]);
  useEffect(() => {
    setTasks([]);
    setTaskId('');
    if (!tasksEnabled) return;
    let active = true;
    void listTasks({ page: taskPage, pageSize: 100 })
      .then((value) => {
        if (active) {
          setTasks(value.items);
          setTaskPages(value.totalPages);
        }
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível carregar as tarefas. Você pode iniciar sem tarefa.',
          );
      });
    return () => {
      active = false;
    };
  }, [tasksEnabled, taskPage]);
  useEffect(() => {
    if (session?.state !== 'RUNNING') return;
    const interval = window.setInterval(
      () =>
        setTick(Math.floor((performance.now() - receivedAt.current) / 1000)),
      250,
    );
    return () => window.clearInterval(interval);
  }, [session]);
  const elapsed =
    session?.state === 'RUNNING' ? Math.min(tick, session.remainingSeconds) : 0;
  const boundary =
    session?.state === 'RUNNING' && elapsed >= session.remainingSeconds;
  const state = boundary ? 'BETWEEN_BLOCKS' : session?.state;
  const blocks = (session?.completedBlocks ?? 0) + (boundary ? 1 : 0);
  useEffect(() => {
    if (boundary)
      void refresh().catch(() => {
        setError('Não foi possível sincronizar o fim do bloco.');
        setReady(false);
      });
  }, [boundary, refresh]);
  async function act(action?: PomodoroAction) {
    readVersion.current += 1;
    setBusy(true);
    setError('');
    setMessage('');
    setCanceling(false);
    try {
      const value =
        action && session
          ? await commandPomodoro(session.id, action, session.version)
          : await startPomodoro(
              tasksEnabled && taskId ? taskId : undefined,
              subjectsEnabled && subjectId ? subjectId : undefined,
            );
      accept(value.endedAt ? null : value);
      setMessage(
        action === 'cancel'
          ? 'Sessão cancelada. Seu tempo foi preservado.'
          : action === 'complete'
            ? 'Sessão concluída.'
            : 'Sessão atualizada.',
      );
      await refresh();
      heading.current?.focus();
    } catch {
      setError(
        'A ação não foi confirmada. Confira o estado recuperado antes de tentar novamente.',
      );
      try {
        await refresh();
      } catch {
        setReady(false);
        setError(
          'Não foi possível recuperar a sessão. Sincronize antes de tentar novamente.',
        );
      }
    } finally {
      setBusy(false);
    }
  }
  async function retry() {
    setBusy(true);
    setError('');
    try {
      await refresh();
    } catch {
      setReady(false);
      setError('Não foi possível sincronizar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="pomodoro-page" aria-busy={busy}>
      <h1 ref={heading} tabIndex={-1}>
        Pomodoro
      </h1>
      <p>Blocos de 25 minutos de foco. As pausas não contam como estudo.</p>
      {busy && <p role="status">Carregando…</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button disabled={busy} onClick={() => void retry()}>
        Sincronizar
      </button>
      {ready && !session && (
        <div>
          <p>Nenhuma sessão em andamento.</p>
          {tasksEnabled && (
            <>
              <label>
                Tarefa opcional
                <select
                  value={taskId}
                  onChange={(event) => setTaskId(event.target.value)}
                  disabled={busy}
                >
                  <option value="">Sem tarefa</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </label>
              {taskPages > 1 && (
                <div>
                  <button
                    disabled={taskPage === 1 || busy}
                    onClick={() => setTaskPage(taskPage - 1)}
                  >
                    Tarefas anteriores
                  </button>
                  <button
                    disabled={taskPage >= taskPages || busy}
                    onClick={() => setTaskPage(taskPage + 1)}
                  >
                    Mais tarefas
                  </button>
                </div>
              )}
            </>
          )}
          {subjectsEnabled && (
            <SubjectSelect
              value={subjectId}
              onChange={setSubjectId}
              disabled={busy}
            />
          )}
          <button disabled={busy} onClick={() => void act()}>
            Iniciar sessão
          </button>
        </div>
      )}
      {session && (
        <div>
          <p role="status">
            {state === 'RUNNING'
              ? 'Em execução'
              : state === 'PAUSED'
                ? 'Em pausa'
                : 'Bloco concluído'}
          </p>
          <p className="pomodoro-clock" aria-label="Tempo restante no bloco">
            {format(Math.max(0, session.remainingSeconds - elapsed))}
          </p>
          <p>
            Tempo ativo total: {format(session.activeSeconds + elapsed)} ·
            Blocos concluídos: {blocks}
          </p>
          <div className="pomodoro-actions">
            {state === 'RUNNING' && (
              <button
                disabled={busy || !ready}
                onClick={() => void act('pause')}
              >
                Pausar
              </button>
            )}
            {state === 'PAUSED' && (
              <button
                disabled={busy || !ready}
                onClick={() => void act('resume')}
              >
                Continuar
              </button>
            )}
            {state === 'BETWEEN_BLOCKS' && (
              <button
                disabled={busy || !ready}
                onClick={() => void act('next-block')}
              >
                Iniciar próximo bloco
              </button>
            )}
            {blocks > 0 && (
              <button
                disabled={busy || !ready}
                onClick={() => void act('complete')}
              >
                Concluir
              </button>
            )}
            <button
              ref={cancelButton}
              disabled={busy || !ready}
              onClick={() => setCanceling(true)}
            >
              Cancelar sessão
            </button>
          </div>
          {canceling && (
            <div role="group" aria-label="Confirmar cancelamento">
              <p>
                Cancelar a sessão? O tempo estudado e os blocos serão
                preservados.
              </p>
              <button
                autoFocus
                onClick={() => {
                  setCanceling(false);
                  cancelButton.current?.focus();
                }}
              >
                Manter sessão
              </button>
              <button onClick={() => void act('cancel')}>
                Confirmar cancelamento
              </button>
            </div>
          )}
        </div>
      )}
      <h2>Histórico</h2>
      {subjectsEnabled && (
        <SubjectSelect
          label="Filtrar histórico por matéria"
          value={historySubject}
          onChange={(value) => {
            setHistorySubject(value);
            setPage(1);
          }}
          disabled={busy}
        />
      )}
      {session && subjectsEnabled && (
        <p>
          <SubjectName id={session.subjectId} />
        </p>
      )}
      {summary && (
        <p>
          Total estudado: {format(summary.activeSeconds)} ·{' '}
          {summary.completedBlocks} blocos
        </p>
      )}
      {history &&
        (history.items.length ? (
          <ul>
            {history.items.map((item) => (
              <li key={item.id}>
                {new Date(item.startedAt).toLocaleString('pt-BR')} ·{' '}
                {item.state === 'COMPLETED' ? 'Concluída' : 'Cancelada'} ·{' '}
                {format(item.activeSeconds)} · {item.completedBlocks} blocos ·{' '}
                {item.taskId ? `Tarefa ${item.taskId}` : 'Sem tarefa'}
                {subjectsEnabled && (
                  <>
                    {' '}
                    · <SubjectName id={item.subjectId} />
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma sessão encerrada.</p>
        ))}
      {history && history.totalPages > 1 && (
        <nav aria-label="Páginas do histórico">
          <button
            disabled={busy || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page} de {history.totalPages}
          </span>
          <button
            disabled={busy || page >= history.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </section>
  );
}
