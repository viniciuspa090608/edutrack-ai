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
export function DashboardPage({ displayName }: { displayName: string }) {
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
  ) {
    const section = data?.[key];
    if (!section) return null;
    return (
      <Card asChild>
        <section
          className="dashboard-card"
          aria-labelledby={`dashboard-${key}`}
        >
          <CardHeader>
            <h2 id={`dashboard-${key}`}>{title}</h2>
          </CardHeader>
          <CardContent>
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
            <a href={href}>Abrir {title.toLowerCase()}</a>
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
      <h1>Olá, {displayName}</h1>
      <p>Escolha seu próximo passo de estudo.</p>
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
          <p>
            Fuso de estudo: {data.timeZone ?? 'Indisponível'}. Resumos
            consultados em{' '}
            <time dateTime={data.asOf}>
              {new Date(data.asOf).toLocaleString('pt-BR')}
            </time>
            .
          </p>
          {(['tasks', 'subjects', 'flashcards'] as const).some(
            (key) => !data.preferences[key],
          ) && (
            <p>
              Alguns módulos estão desativados.{' '}
              <a href="/conta">Reativar nas preferências</a>
            </p>
          )}
          <div className="dashboard-grid">
            {card(
              'pomodoro',
              'Pomodoro',
              '/app/pomodoro',
              <>
                <p>{pomo?.completedSessions} sessões concluídas.</p>
                {pomo?.session ? (
                  <>
                    <p>
                      Sessão aberta:{' '}
                      {pomo.session.state === 'RUNNING'
                        ? 'Em andamento'
                        : pomo.session.state === 'PAUSED'
                          ? 'Pausada'
                          : 'Entre blocos'}
                      .
                    </p>
                    <a className="dashboard-action" href="/app/pomodoro">
                      Retomar Pomodoro
                    </a>
                  </>
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
            )}
            {card(
              'tasks',
              'Tarefas',
              '/app/tarefas',
              tasks && (
                <>
                  <p>
                    {tasks.counts.PENDING} pendentes ·{' '}
                    {tasks.counts.IN_PROGRESS} em andamento ·{' '}
                    {tasks.counts.COMPLETED} concluídas.
                  </p>
                  {tasks.upcoming.length ? (
                    <ul>
                      {tasks.upcoming.map((task) => (
                        <li key={task.id}>
                          <strong>{task.title}</strong>
                          <p>
                            Prazo:{' '}
                            <time dateTime={task.dueDate!}>{task.dueDate}</time>
                            {today && task.dueDate! < today
                              ? ' · Atrasada'
                              : ''}
                          </p>
                          <p>
                            {task.progressPercent === null
                              ? status[task.status]
                              : `${task.progressPercent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% concluído`}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>
                      {Object.values(tasks.counts).every((value) => value === 0)
                        ? 'Crie sua primeira tarefa para organizar os estudos.'
                        : 'Não há próximas tarefas com prazo.'}
                    </p>
                  )}
                  <p>
                    {tasks.withoutDeadline} tarefas ativas sem prazo permanecem
                    no módulo de tarefas.
                  </p>
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
                </>
              ) : (
                <p>
                  Crie uma matéria e organize seu plano de estudo, com ou sem
                  IA.
                </p>
              ),
            )}
            {card(
              'flashcards',
              'Flashcards',
              '/app/flashcards',
              <>
                <p>{pending} cartões pendentes de revisão.</p>
                {pending === 0 && (
                  <p>
                    Abra flashcards para criar um baralho ou consultar seus
                    cartões.
                  </p>
                )}
              </>,
            )}
            {card(
              'streak',
              'Progresso',
              '/app/progresso',
              <>
                <p>
                  Sequência atual: {streak?.currentStreak} dias. Recorde:{' '}
                  {streak?.longestStreak} dias.
                </p>
                <p>
                  Histórico rastreado desde{' '}
                  {streak?.trackingStartedAt.slice(0, 10)}. Atividades
                  anteriores não contam.
                </p>
                {streak?.activeDays === 0 && (
                  <p>
                    Conclua uma atividade de estudo para registrar seu primeiro
                    dia ativo.
                  </p>
                )}
              </>,
            )}
            {card(
              'week',
              'Estatísticas',
              '/app/estatisticas',
              week && (
                <>
                  <p>
                    Semana: {week.period.start} a {week.period.end} (fim
                    exclusivo) · {week.timeZone}
                    {week.period.partial ? ' · Período parcial' : ''}.
                  </p>
                  <p>
                    {week.frequency.activeDays} dias ativos nesta semana
                    {week.frequency.status === 'history_unavailable'
                      ? ' · Histórico incompleto'
                      : ''}
                    .
                  </p>
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
