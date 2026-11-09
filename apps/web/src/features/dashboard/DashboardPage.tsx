import { CollectionEmptyState } from '../../components/CollectionEmptyState.js';
import { DashboardPomodoro } from './DashboardPomodoro.js';
import { listSubjects } from '../subjects/subjects-api.js';
import {
  CardHeader,
  Card,
  CardContent,
} from '@study-platform/ui/components/ui/card';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';

import { Button } from '@study-platform/ui/components/ui/button';
import { Badge } from '@study-platform/ui/components/ui/badge';
import { Progress } from '@study-platform/ui/components/ui/progress';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Layers3,
  BarChart3,
} from 'lucide-react';
import { DashboardWeeklyChart } from './DashboardWeeklyChart.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Dashboard } from '@study-platform/contracts';
import { dashboard } from './dashboard-api.js';
import { AuthApiError, navigate } from '../auth/auth-api.js';
import { currentPomodoro, startPomodoro } from '../pomodoro/pomodoro-api.js';
import '../../styles/dashboard.css';
type SectionKey =
  'tasks' | 'subjects' | 'pomodoro' | 'flashcards' | 'streak' | 'week';
const status = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
};
const metrics = {
  activeMs: 'Tempo de foco',
  pomodoroSessions: 'Sessões concluídas',
  tasks: 'Tarefas concluídas',
  reviews: 'Avaliações de flashcards',
  planItems: 'Itens de plano concluídos',
  roadmapBlocks: 'Blocos de roadmap concluídos',
};
const sectionIcons = {
  tasks: CheckCircle2,
  subjects: BookOpen,
  pomodoro: Clock3,
  flashcards: Layers3,
  streak: Flame,
  week: BarChart3,
};
const priorities = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };
function DashboardTaskList({ children }: { children: ReactNode }) {
  const list = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ above: false, below: false });
  const updateEdges = useCallback(() => {
    const element = list.current;
    if (!element) return;
    setEdges({
      above: element.scrollTop > 1,
      below:
        element.scrollHeight - element.clientHeight - element.scrollTop > 1,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const element = list.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    for (const item of element.children) observer.observe(item);
    return () => observer.disconnect();
  }, [children, updateEdges]);

  return (
    <div
      className="dashboard-task-scroll"
      data-above={edges.above}
      data-below={edges.below}
    >
      <ul
        ref={list}
        className="dashboard-task-list"
        aria-label="Próximas tarefas"
        tabIndex={0}
        onScroll={updateEdges}
      >
        {children}
      </ul>
    </div>
  );
}

export function DashboardPage({ displayName }: { displayName: string }) {
  const [subjectsEmpty, setSubjectsEmpty] = useState<boolean | null>(null);
  const [subjectsError, setSubjectsError] = useState(false);
  const [subjectsRetry, setSubjectsRetry] = useState(0);
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const version = useRef(0);
  const load = useCallback(async (section?: SectionKey) => {
    const request = ++version.current;
    setLoading(true);
    setError('');
    try {
      const fresh = await dashboard();
      if (request !== version.current) return;
      setData((previous) => {
        if (!previous || !section) return fresh;
        const merged = { ...fresh };
        for (const key of [
          'tasks',
          'subjects',
          'pomodoro',
          'flashcards',
          'streak',
          'week',
        ] as const)
          if (key !== section && fresh[key] && previous[key])
            Object.assign(merged, { [key]: previous[key] });
        return merged;
      });
    } catch (cause) {
      if (request !== version.current) return;
      if (cause instanceof AuthApiError && cause.status === 401)
        navigate('/acesso?returnTo=%2Fapp');
      else setError('Não foi possível carregar o dashboard. Tente novamente.');
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => {
      void load();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('edutrack:preferences', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      version.current++;
      window.removeEventListener('focus', refresh);
      window.removeEventListener('edutrack:preferences', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [load]);
  useEffect(() => {
    let active = true;
    setSubjectsEmpty(null);
    setSubjectsError(false);
    if (
      !data?.subjects ||
      data.subjects.state === 'error' ||
      data.subjects.data
    )
      return;
    void listSubjects(1, 1)
      .then((value) => {
        if (active) setSubjectsEmpty(value.total === 0);
      })
      .catch(() => {
        if (active) setSubjectsError(true);
      });
    return () => {
      active = false;
    };
  }, [data?.subjects, subjectsRetry]);
  async function begin() {
    if (starting) return;
    setStarting(true);
    setStartError('');
    try {
      // Reconcile an uncertain prior request before issuing any new start command.
      if (uncertain) {
        const current = await currentPomodoro();
        if (current) {
          navigate('/app/pomodoro');
          return;
        }
        setUncertain(false);
      }
      await startPomodoro();
      navigate('/app/pomodoro');
    } catch {
      setUncertain(true);
      try {
        if (await currentPomodoro()) {
          navigate('/app/pomodoro');
          return;
        }
        setUncertain(false);
        setStartError('A sessão não foi iniciada. Tente novamente.');
      } catch {
        setStartError(
          'Não foi possível confirmar a sessão. Consulte novamente antes de iniciar outra.',
        );
      }
    } finally {
      setStarting(false);
    }
  }
  function card(
    key: SectionKey,
    title: string,
    href: string,
    content: ReactNode,
    summary?: ReactNode,
  ) {
    const section = data?.[key];
    if (!section) return null;
    const Icon = sectionIcons[key];
    return (
      <Card asChild>
        <section
          className={`dashboard-card dashboard-card-${key}${(key === 'tasks' && tasksEmpty) || (key === 'subjects' && subjectsEmpty) ? ' dashboard-card-empty' : ''}`}
          aria-labelledby={`dashboard-${key}`}
        >
          <CardHeader>
            <span className="dashboard-section-icon" aria-hidden="true">
              <Icon size={20} />
            </span>
            <div className="dashboard-card-heading">
              <h2 id={`dashboard-${key}`}>{title}</h2>
              {section.state !== 'error' && summary && <p>{summary}</p>}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="dashboard-card-body"
              tabIndex={key === 'tasks' || key === 'pomodoro' ? undefined : 0}
              aria-label={
                key === 'tasks' || key === 'pomodoro'
                  ? undefined
                  : `Conteúdo de ${title}`
              }
            >
              {section.state === 'error' ? (
                <>
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{section.message}</AlertDescription>
                  </Alert>
                  <Button
                    disabled={loading}
                    onClick={() => {
                      void load(key);
                    }}
                  >
                    Tentar novamente: {title}
                  </Button>
                </>
              ) : (
                content
              )}
            </div>
            <a className="dashboard-module-link" href={href}>
              Abrir {title.toLowerCase()}{' '}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </CardContent>
        </section>
      </Card>
    );
  }
  const tasks = data?.tasks?.state !== 'error' ? data?.tasks?.data : undefined;
  const subject =
    data?.subjects?.state !== 'error' ? data?.subjects?.data : undefined;
  const pomo =
    data?.pomodoro.state !== 'error' ? data?.pomodoro.data : undefined;
  const streak = data?.streak.state !== 'error' ? data?.streak.data : undefined;
  const week = data?.week.state !== 'error' ? data?.week.data : undefined;
  const pending =
    data?.flashcards?.state !== 'error'
      ? data?.flashcards?.data.pending
      : undefined;
  const tasksEmpty =
    !!tasks && Object.values(tasks.counts).every((value) => value === 0);
  const today = data?.timeZone
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: data.timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(data.asOf))
    : null;
  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <span className="dashboard-eyebrow">SEU ESPAÇO DE ESTUDO</span>
        <h1>Olá, {displayName}</h1>
        <p>
          {data ? (
            <>
              São{' '}
              <time dateTime={data.asOf}>
                {new Date(data.asOf).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                })}{' '}
                {new Date(data.asOf).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </time>
              , escolha seu próximo passo de aprendizado.
            </>
          ) : (
            'Escolha seu próximo passo de aprendizado.'
          )}
        </p>
      </div>
      {loading && (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando dashboard…</p>
        </div>
      )}
      {error && (
        <>
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => {
              void load();
            }}
          >
            Tentar carregar dashboard novamente
          </Button>
        </>
      )}
      {data && (
        <>
          {(['tasks', 'subjects', 'flashcards'] as const).some(
            (key) => !data.preferences[key],
          ) && (
            <p>
              Alguns módulos estão desativados.{' '}
              <a href="/conta">Reativar nas preferências</a>
            </p>
          )}
          <div className="dashboard-indicators" aria-label="Resumo dos estudos">
            {data.tasks && (
              <div>
                <CheckCircle2 aria-hidden="true" />
                <span>Tarefas concluídas</span>
                <strong>
                  {tasks ? tasks.counts.COMPLETED : 'Indisponível'}
                </strong>
              </div>
            )}
            <div>
              <Flame aria-hidden="true" />
              <span>Sequência atual</span>
              <strong>
                {streak ? `${streak.currentStreak} dias` : 'Indisponível'}
              </strong>
            </div>
            <div>
              <Clock3 aria-hidden="true" />
              <span>Foco nesta semana</span>
              <strong>
                {week?.metrics.activeMs
                  ? week.metrics.activeMs.current === null
                    ? 'Histórico indisponível'
                    : `${(week.metrics.activeMs.current / 60000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`
                  : 'Indisponível'}
              </strong>
            </div>
            {data.flashcards && (
              <div>
                <Layers3 aria-hidden="true" />
                <span>Revisões pendentes</span>
                <strong>{pending ?? 'Indisponível'}</strong>
              </div>
            )}
          </div>
          <div
            className={`dashboard-grid${data.flashcards ? '' : ' dashboard-without-flashcards'}${data.tasks ? '' : ' dashboard-without-tasks'}`}
          >
            {card(
              'pomodoro',
              'Pomodoro',
              '/app/pomodoro',
              <>
                {pomo?.session ? (
                  <DashboardPomodoro initial={pomo.session} />
                ) : (
                  <>
                    <p>Comece um bloco de foco de 25 minutos.</p>
                    <Button
                      disabled={starting}
                      onClick={() => {
                        void begin();
                      }}
                    >
                      {starting
                        ? 'Consultando sessão…'
                        : uncertain
                          ? 'Consultar sessão e iniciar'
                          : 'Iniciar Pomodoro'}
                    </Button>
                  </>
                )}
                {startError && (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{startError}</AlertDescription>
                  </Alert>
                )}
              </>,
              pomo && <>{pomo.completedSessions} sessões concluídas.</>,
            )}
            {card(
              'tasks',
              'Tarefas',
              '/app/tarefas',
              tasksEmpty ? (
                <CollectionEmptyState
                  icon={<CheckCircle2 />}
                  title="Nenhuma tarefa cadastrada"
                  description="Crie sua primeira tarefa para organizar os estudos."
                  actionLabel="Adicionar tarefa"
                  onAction={() => navigate('/app/tarefas?create=1')}
                />
              ) : (
                tasks && (
                  <>
                    {tasks.upcoming.length ? (
                      <DashboardTaskList>
                        {tasks.upcoming.map((task) => (
                          <li key={task.id}>
                            <strong>{task.title}</strong>
                            <div className="dashboard-task-badges">
                              <Badge variant="secondary">
                                Prioridade {priorities[task.priority]}
                              </Badge>
                              <Badge variant="outline">
                                {status[task.status]}
                              </Badge>
                            </div>
                            <p>
                              Prazo:{' '}
                              <time dateTime={task.dueDate!}>
                                {task.dueDate}
                              </time>
                              {today && task.dueDate! < today
                                ? ' · Atrasada'
                                : ''}
                            </p>
                            {task.subtaskTotal > 0 && (
                              <p>
                                {task.subtaskCompleted}/{task.subtaskTotal}{' '}
                                subtarefas concluídas
                              </p>
                            )}
                            {task.progressPercent !== null && (
                              <Progress
                                value={task.progressPercent}
                                aria-label={`Progresso de ${task.title}`}
                              />
                            )}
                            <p>
                              {task.progressPercent === null
                                ? status[task.status]
                                : `${task.progressPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% concluído`}
                            </p>
                          </li>
                        ))}
                      </DashboardTaskList>
                    ) : (
                      <p>
                        {Object.values(tasks.counts).every(
                          (value) => value === 0,
                        )
                          ? 'Crie sua primeira tarefa para organizar os estudos.'
                          : 'Não há próximas tarefas com prazo.'}
                      </p>
                    )}
                  </>
                )
              ),
              tasks && !tasksEmpty && (
                <>
                  {tasks.counts.PENDING} pendentes · {tasks.counts.IN_PROGRESS}{' '}
                  em andamento · {tasks.counts.COMPLETED} concluídas.
                </>
              ),
            )}
            {card(
              'subjects',
              'Matérias',
              subject
                ? `/app/materias?subject=${encodeURIComponent(subject.id)}${subject.roadmapId ? `#roadmap-${encodeURIComponent(subject.roadmapId)}` : ''}`
                : '/app/materias',
              subject ? (
                <>
                  <h3>{subject.name}</h3>
                  <p>
                    Prazo: {subject.dueDate}.{' '}
                    {subject.hasPending
                      ? 'Há estudo pendente.'
                      : 'Sem pendências de estudo.'}
                  </p>
                  <p>
                    {subject.title} ·{' '}
                    {subject.source === 'roadmap' ? 'Roadmap' : 'Plano manual'}
                  </p>
                  <p>
                    {subject.completed} de {subject.total} concluídos
                    {subject.progressPercent !== null
                      ? ` · ${subject.progressPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                      : ''}
                    .
                  </p>
                  {subject.progressPercent !== null && (
                    <Progress
                      value={subject.progressPercent}
                      aria-label={`Progresso de ${subject.name}`}
                    />
                  )}
                </>
              ) : subjectsEmpty ? (
                <CollectionEmptyState
                  icon={<BookOpen />}
                  title="Nenhuma matéria cadastrada"
                  description="Crie uma matéria e organize seu plano de estudo, com ou sem IA."
                  actionLabel="Adicionar matéria"
                  onAction={() => navigate('/app/materias?create=1')}
                />
              ) : subjectsError ? (
                <div role="alert">
                  <p>Não foi possível consultar suas matérias.</p>
                  <Button
                    onClick={() => setSubjectsRetry((value) => value + 1)}
                  >
                    Tentar consultar matérias
                  </Button>
                </div>
              ) : (
                <p>
                  {subjectsEmpty === null
                    ? 'Consultando matérias…'
                    : 'Nenhuma matéria em destaque. Abra suas matérias para continuar estudando.'}
                </p>
              ),
            )}
            {card(
              'flashcards',
              'Flashcards',
              '/app/flashcards',
              <>
                {pending === 0 && (
                  <p>
                    Abra flashcards para criar um baralho ou consultar seus
                    cartões.
                  </p>
                )}
              </>,
              pending !== undefined && (
                <>{pending} cartões pendentes de revisão.</>
              ),
            )}
            {card(
              'streak',
              'Progresso',
              '/app/progresso',
              <div className="dashboard-streak-lines">
                {streak?.activeDays === 0 ? (
                  <h3>Nenhuma atividade registrada</h3>
                ) : (
                  <>
                    <p>
                      Sequência atual:{' '}
                      <strong>{streak?.currentStreak} dias</strong>.
                    </p>
                    <p>
                      Recorde: <strong>{streak?.longestStreak} dias</strong>.
                    </p>
                  </>
                )}
                {streak?.trackingStartedAt && (
                  <p>
                    Histórico desde{' '}
                    {streak.trackingStartedAt
                      .slice(0, 10)
                      .split('-')
                      .reverse()
                      .join('/')}
                  </p>
                )}
                {streak && streak.activeDays > 0 && (
                  <p>
                    <strong>{streak.activeDays} dias ativos</strong> no
                    histórico rastreado.
                  </p>
                )}
                {streak?.activeDays === 0 && (
                  <p>
                    Conclua uma atividade de estudo para registrar seu primeiro
                    dia ativo.
                  </p>
                )}
              </div>,
            )}
            {card(
              'week',
              'Estatísticas',
              '/app/estatisticas',
              week && (
                <>
                  <p>
                    {week.frequency.activeDays} dias ativos nesta semana
                    {week.frequency.status === 'history_unavailable'
                      ? ' · Histórico incompleto'
                      : ''}
                    .
                  </p>
                  <DashboardWeeklyChart series={week.series} />
                  <dl>
                    {Object.entries(week.metrics).map(([key, metric]) => (
                      <div key={key}>
                        <dt>{metrics[key as keyof typeof metrics]}</dt>
                        <dd>
                          {metric!.current === null
                            ? 'Histórico indisponível'
                            : key === 'activeMs'
                              ? `${(metric!.current / 60000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`
                              : metric!.current}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {data.week.state === 'empty' && (
                    <p>
                      Nenhuma atividade registrada nesta semana. Comece pelos
                      módulos disponíveis.
                    </p>
                  )}
                </>
              ),
              week && (
                <>
                  Semana: {week.period.start} a {week.period.end} (fim
                  exclusivo)
                  {week.period.partial ? ' · Período parcial' : ''}.
                </>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
