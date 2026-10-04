import { Badge } from '@study-platform/ui/components/ui/badge';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';
import {
  Timer,
  Play,
  Pause,
  CircleCheck,
  Square,
  RefreshCw,
  History,
  Clock3,
  Layers,
} from 'lucide-react';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
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

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@study-platform/ui/components/ui/native-select';
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

  const remaining = session
    ? Math.max(0, session.remainingSeconds - elapsed)
    : 1500;
  const progress = Math.min(100, Math.max(0, (1 - remaining / 1500) * 100));
  const taskLabel = (id: string | null) =>
    id
      ? (tasks.find((task) => task.id === id)?.title ?? `Tarefa ${id}`)
      : 'Sem tarefa';
  return (
    <section className="pomodoro-page pomodoro-surface" aria-busy={busy}>
      <header className="pomodoro-heading">
        <div>
          <p className="pomodoro-eyebrow">SEU TEMPO DE ESTUDO</p>
          <h1 ref={heading} tabIndex={-1}>
            Pomodoro
          </h1>
          <p className="pomodoro-muted">
            Blocos de 25 minutos de foco. As pausas não contam como estudo.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void retry()}>
          <RefreshCw aria-hidden="true" />
          Sincronizar
        </Button>
      </header>
      {busy && (
        <div className="pomodoro-loading">
          <Skeleton aria-hidden="true" className="h-3 w-2/3" />
          <p role="status">Carregando…</p>
        </div>
      )}
      {error && !canceling && (
        <Alert className="pomodoro-feedback" variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <p className="pomodoro-success" role="status">
          <CircleCheck aria-hidden="true" />
          {message}
        </p>
      )}
      <div className="pomodoro-layout">
        <Card
          className="pomodoro-card pomodoro-focus"
          data-state={session ? state : 'IDLE'}
        >
          <CardContent>
            <div className="pomodoro-card-heading">
              <span className="pomodoro-icon">
                <Timer aria-hidden="true" />
              </span>
              <h2>
                {session ? 'Sua sessão de foco' : 'Prepare seu próximo foco'}
              </h2>
            </div>
            {ready && !session && (
              <>
                <Badge className="pomodoro-status" variant="secondary">
                  Não iniciado
                </Badge>
                <div className="pomodoro-preparation">
                  <Timer aria-hidden="true" />
                  <p>Nenhuma sessão em andamento.</p>
                  <p className="pomodoro-muted">
                    Escolha o que estudar e reserve um bloco de foco.
                  </p>
                  <span className="pomodoro-duration">
                    25 minutos por bloco
                  </span>
                </div>
                <div className="pomodoro-fields">
                  {tasksEnabled && (
                    <div>
                      <Label>
                        Tarefa opcional
                        <NativeSelect
                          value={taskId}
                          onChange={(event) => setTaskId(event.target.value)}
                          disabled={busy}
                        >
                          <NativeSelectOption value="">
                            Sem tarefa
                          </NativeSelectOption>
                          {tasks.map((task) => (
                            <NativeSelectOption key={task.id} value={task.id}>
                              {task.title}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Label>
                      {taskPages > 1 && (
                        <div className="pomodoro-actions">
                          <Button
                            variant="outline"
                            disabled={taskPage === 1 || busy}
                            onClick={() => setTaskPage(taskPage - 1)}
                          >
                            Tarefas anteriores
                          </Button>
                          <Button
                            variant="outline"
                            disabled={taskPage >= taskPages || busy}
                            onClick={() => setTaskPage(taskPage + 1)}
                          >
                            Mais tarefas
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  {subjectsEnabled && (
                    <SubjectSelect
                      value={subjectId}
                      onChange={setSubjectId}
                      disabled={busy}
                    />
                  )}
                </div>
                <Button
                  className="pomodoro-start"
                  disabled={busy}
                  onClick={() => void act()}
                >
                  <Play aria-hidden="true" />
                  Iniciar sessão
                </Button>
              </>
            )}
            {session && (
              <>
                <p role="status" className="pomodoro-session-status">
                  <Badge className="pomodoro-status" variant="secondary">
                    {state === 'RUNNING'
                      ? 'Em execução'
                      : state === 'PAUSED'
                        ? 'Em pausa'
                        : 'Bloco concluído'}
                  </Badge>
                </p>
                <div className="pomodoro-timer">
                  <svg
                    className="pomodoro-ring"
                    viewBox="0 0 120 120"
                    aria-hidden="true"
                  >
                    <circle
                      className="pomodoro-ring-track"
                      cx="60"
                      cy="60"
                      r="54"
                    />
                    <circle
                      className="pomodoro-ring-value"
                      cx="60"
                      cy="60"
                      r="54"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={100 - progress}
                    />
                  </svg>
                  <div className="pomodoro-timer-content">
                    <span className="pomodoro-eyebrow">TEMPO RESTANTE</span>
                    <p
                      className="pomodoro-clock"
                      aria-label="Tempo restante no bloco"
                    >
                      {format(remaining)}
                    </p>
                    <span className="pomodoro-duration">
                      25 minutos por bloco
                    </span>
                  </div>
                </div>
                <div className="pomodoro-context">
                  {subjectsEnabled && <SubjectName id={session.subjectId} />}
                  <p>{taskLabel(session.taskId)}</p>
                </div>
                <div className="pomodoro-actions pomodoro-main-actions">
                  {state === 'RUNNING' && (
                    <Button
                      disabled={busy || !ready}
                      onClick={() => void act('pause')}
                    >
                      <Pause aria-hidden="true" />
                      Pausar
                    </Button>
                  )}
                  {state === 'PAUSED' && (
                    <Button
                      disabled={busy || !ready}
                      onClick={() => void act('resume')}
                    >
                      <Play aria-hidden="true" />
                      Continuar
                    </Button>
                  )}
                  {state === 'BETWEEN_BLOCKS' && (
                    <Button
                      disabled={busy || !ready}
                      onClick={() => void act('next-block')}
                    >
                      <Play aria-hidden="true" />
                      Iniciar próximo bloco
                    </Button>
                  )}
                  {blocks > 0 && (
                    <Button
                      variant="outline"
                      disabled={busy || !ready}
                      onClick={() => void act('complete')}
                    >
                      <CircleCheck aria-hidden="true" />
                      Concluir
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    ref={cancelButton}
                    disabled={busy || !ready}
                    onClick={() => setCanceling(true)}
                  >
                    <Square aria-hidden="true" />
                    Cancelar sessão
                  </Button>
                </div>
                <div className="pomodoro-session-summary">
                  <p>
                    Tempo ativo total:{' '}
                    <strong>{format(session.activeSeconds + elapsed)}</strong>
                  </p>
                  <p>
                    Blocos concluídos: <strong>{blocks}</strong>
                  </p>
                </div>
                {state === 'PAUSED' && (
                  <p className="pomodoro-state-note">
                    Seu tempo está preservado. Continue quando estiver pronto.
                  </p>
                )}
                {state === 'BETWEEN_BLOCKS' && (
                  <p className="pomodoro-state-note">
                    O timer está parado. Inicie outro bloco, conclua ou cancele
                    a sessão.
                  </p>
                )}
                {canceling && (
                  <AlertDialog
                    open
                    onOpenChange={(open) => {
                      if (!open && !busy) setCanceling(false);
                    }}
                  >
                    <AlertDialogContent
                      className="pomodoro-surface pomodoro-confirmation"
                      onEscapeKeyDown={(event) => {
                        event.preventDefault();
                        if (!busy) setCanceling(false);
                      }}
                      onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        cancelButton.current?.focus();
                      }}
                    >
                      <AlertDialogTitle>
                        Confirmar cancelamento
                      </AlertDialogTitle>
                      <div role="group" aria-label="Confirmar cancelamento">
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <AlertDialogDescription asChild>
                          <p>
                            Cancelar a sessão? O tempo estudado e os blocos
                            serão preservados.
                          </p>
                        </AlertDialogDescription>
                        <div className="pomodoro-actions">
                          <Button
                            variant="outline"
                            autoFocus
                            onClick={() => {
                              setCanceling(false);
                              cancelButton.current?.focus();
                            }}
                          >
                            Manter sessão
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => void act('cancel')}
                          >
                            Confirmar cancelamento
                          </Button>
                        </div>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
            {!ready && !session && (
              <div className="pomodoro-empty">
                <Timer aria-hidden="true" />
                <p className="pomodoro-muted">
                  {busy
                    ? 'Consultando sua sessão…'
                    : 'Sincronize para recuperar sua sessão antes de iniciar.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <aside
          className="pomodoro-totals"
          aria-label="Totais das sessões encerradas"
        >
          <Card className="pomodoro-card">
            <CardContent>
              <div className="pomodoro-card-heading">
                <span className="pomodoro-icon">
                  <Clock3 aria-hidden="true" />
                </span>
                <h2>Tempo estudado</h2>
              </div>
              {summary ? (
                <p className="pomodoro-total" aria-label="Total estudado">
                  Total estudado:{' '}
                  <strong>{format(summary.activeSeconds)}</strong>
                </p>
              ) : (
                <p className="pomodoro-muted">
                  {busy
                    ? 'Carregando totais…'
                    : 'Totais indisponíveis. Sincronize para tentar novamente.'}
                </p>
              )}
              <p className="pomodoro-muted">
                Tempo ativo das sessões encerradas, sem contar as pausas.
              </p>
            </CardContent>
          </Card>
          <Card className="pomodoro-card">
            <CardContent>
              <div className="pomodoro-card-heading">
                <span className="pomodoro-icon">
                  <Layers aria-hidden="true" />
                </span>
                <h2>Blocos de foco</h2>
              </div>
              {summary && (
                <p className="pomodoro-total">
                  <strong>{summary.completedBlocks}</strong> blocos
                </p>
              )}
              <p className="pomodoro-muted">
                Blocos completos registrados nas sessões encerradas.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
      <Card className="pomodoro-card pomodoro-history">
        <CardContent>
          <div className="pomodoro-history-heading">
            <div className="pomodoro-card-heading">
              <span className="pomodoro-icon">
                <History aria-hidden="true" />
              </span>
              <div>
                <h2>Histórico</h2>
                <p className="pomodoro-muted">
                  Cada bloco faz parte do seu caminho.
                </p>
              </div>
            </div>
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
          </div>
          {history ? (
            history.items.length ? (
              <ul className="pomodoro-history-list">
                {history.items.map((item) => (
                  <li
                    key={item.id}
                    className="pomodoro-history-item"
                    data-state={item.state}
                  >
                    <div className="pomodoro-history-item-heading">
                      <Badge className="pomodoro-status" variant="secondary">
                        {item.state === 'COMPLETED' ? 'Concluída' : 'Cancelada'}
                      </Badge>
                      <strong>
                        {format(item.activeSeconds)}{' '}
                        <span className="pomodoro-muted">
                          de estudo · {item.completedBlocks} blocos
                        </span>
                      </strong>
                    </div>
                    <div className="pomodoro-history-context">
                      <p>{taskLabel(item.taskId)}</p>
                      {subjectsEnabled && <SubjectName id={item.subjectId} />}
                    </div>
                    <div className="pomodoro-dates">
                      <p>
                        Início:{' '}
                        <time dateTime={item.startedAt}>
                          {new Date(item.startedAt).toLocaleString('pt-BR')}
                        </time>
                      </p>
                      {item.endedAt && (
                        <p>
                          Término:{' '}
                          <time dateTime={item.endedAt}>
                            {new Date(item.endedAt).toLocaleString('pt-BR')}
                          </time>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="pomodoro-empty">
                <History aria-hidden="true" />
                <h3>Nenhuma sessão encerrada.</h3>
                <p className="pomodoro-muted">
                  Suas sessões concluídas e canceladas aparecerão aqui.
                </p>
              </div>
            )
          ) : (
            <div className="pomodoro-empty">
              <p className="pomodoro-muted">
                {busy
                  ? 'Carregando histórico…'
                  : 'Histórico indisponível. Sincronize para tentar novamente.'}
              </p>
            </div>
          )}
          {history && history.totalPages > 1 && (
            <Pagination aria-label="Páginas do histórico">
              <PaginationContent className="flex-wrap">
                <PaginationItem>
                  <Button
                    variant="outline"
                    disabled={busy || page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span>
                    Página {page} de {history.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="outline"
                    disabled={busy || page >= history.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
