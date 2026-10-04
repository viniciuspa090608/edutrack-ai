import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Badge } from '@study-platform/ui/components/ui/badge';
import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import { Progress } from '@study-platform/ui/components/ui/progress';
import {
  CalendarDays,
  CheckCheck,
  CircleCheck,
  Flame,
  Flag,
  Layers,
  LockKeyhole,
  Milestone,
  Timer,
  Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AchievementCode, StudyProgress } from '@study-platform/contracts';
import { studyProgress } from './progress-api.js';
import {
  ProgressEmpty,
  ProgressHeader,
  ProgressLoading,
} from './ProgressPresentation.js';
import '../../styles/study-progress.css';

const date = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone, dateStyle: 'medium' }).format(
    new Date(value),
  );
const icons = {
  FIRST_DAY: Flag,
  THREE_DAY_STREAK: Flame,
  SEVEN_DAY_STREAK: Trophy,
  TEN_TASKS: CheckCheck,
  FIVE_POMODORO_BLOCKS: Timer,
  TWENTY_REVIEWS: Layers,
  FIVE_SUBJECT_MILESTONES: Milestone,
} satisfies Record<AchievementCode, typeof Flag>;

export function StudyProgressPage() {
  const [data, setData] = useState<StudyProgress | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    setData(null);
    void studyProgress()
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar seu progresso.');
      });
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <section
      className="study-progress evolution-surface"
      aria-labelledby="study-progress-title"
    >
      <ProgressHeader
        title="Seu progresso"
        titleId="study-progress-title"
        current="progress"
        description="Cada dia de estudo faz parte da sua evolução. Acompanhe sua constância e os marcos que já alcançou."
      />
      {error ? (
        <div className="evolution-error">
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : !data ? (
        <ProgressLoading>Carregando progresso…</ProgressLoading>
      ) : (
        <>
          <dl className="evolution-metrics progress-summary">
            <div className="evolution-card progress-stat progress-stat-featured">
              <dt>
                <span className="evolution-icon">
                  <Flame aria-hidden="true" />
                </span>
                Sequência atual
              </dt>
              <dd>
                {data.currentStreak}{' '}
                <small>{data.currentStreak === 1 ? 'dia' : 'dias'}</small>
              </dd>
              <dd className="progress-stat-note">
                Sua constância mais recente
              </dd>
            </div>
            <div className="evolution-card progress-stat">
              <dt>
                <span className="evolution-icon">
                  <Trophy aria-hidden="true" />
                </span>
                Maior sequência
              </dt>
              <dd>
                {data.longestStreak}{' '}
                <small>{data.longestStreak === 1 ? 'dia' : 'dias'}</small>
              </dd>
              <dd className="progress-stat-note">
                Seu recorde no histórico rastreado
              </dd>
            </div>
            <div className="evolution-card progress-stat">
              <dt>
                <span className="evolution-icon">
                  <CalendarDays aria-hidden="true" />
                </span>
                Dias ativos
              </dt>
              <dd>{data.activeDays}</dd>
              <dd className="progress-stat-note">
                Dias com atividades confirmadas
              </dd>
            </div>
          </dl>
          <div className="evolution-card evolution-context">
            <p>
              Fuso de estudo: <strong>{data.timeZone}</strong>.{' '}
              <a href="/conta">Editar fuso na conta</a>
            </p>
            <p>
              Histórico rastreado desde{' '}
              <time dateTime={data.trackingStartedAt}>
                {date(data.trackingStartedAt, data.timeZone)}
              </time>
              . Atividades anteriores não contam para sequências ou conquistas.
            </p>
            <p>
              A sequência atual continua se você estudou hoje ou ontem. Várias
              atividades na mesma data contam como um dia ativo.
            </p>
          </div>
          {data.activeDays === 0 && (
            <ProgressEmpty title="Sua jornada começa agora">
              <span role="status">
                Seu primeiro dia ativo ainda está por vir. Conclua uma tarefa,
                um bloco Pomodoro de 25 minutos, uma avaliação de flashcard ou
                um marco de matéria.
              </span>
            </ProgressEmpty>
          )}
          <section aria-labelledby="achievements-title">
            <div className="evolution-section-heading">
              <div>
                <p className="evolution-eyebrow">Marcos da sua jornada</p>
                <h2 id="achievements-title">Conquistas</h2>
              </div>
              <span className="evolution-icon">
                <Trophy aria-hidden="true" />
              </span>
            </div>
            {!data.achievements.some((item) => item.earnedAt) && (
              <ProgressEmpty title="Nenhuma conquista obtida ainda">
                Conheça os critérios abaixo e acompanhe seu progresso até cada
                marco.
              </ProgressEmpty>
            )}
            <ul className="progress-achievements">
              {data.achievements.map((item) => {
                const Icon = icons[item.code];
                const state = item.earnedAt
                  ? 'earned'
                  : item.progress > 0
                    ? 'in-progress'
                    : 'locked';
                const StateIcon = item.earnedAt
                  ? CircleCheck
                  : item.progress > 0
                    ? Timer
                    : LockKeyhole;
                return (
                  <li
                    key={item.code}
                    className={`evolution-card achievement-card achievement-${state}`}
                  >
                    <div className="achievement-heading">
                      <span className="evolution-icon">
                        <Icon aria-hidden="true" />
                      </span>
                      <Badge variant="outline" className="achievement-status">
                        <StateIcon aria-hidden="true" />
                        {item.earnedAt
                          ? 'Obtida'
                          : item.progress > 0
                            ? 'Em progresso'
                            : 'Bloqueada'}
                      </Badge>
                    </div>
                    <h3>{item.name}</h3>
                    <p className="achievement-criterion">{item.criterion}</p>
                    <div className="achievement-footer">
                      {item.earnedAt && (
                        <p className="achievement-date">
                          Obtida em{' '}
                          <time dateTime={item.earnedAt}>
                            {date(item.earnedAt, data.timeZone)}
                          </time>
                        </p>
                      )}
                      <Label id={`achievement-label-${item.code}`}>
                        Progresso: {Math.min(item.progress, item.target)} de{' '}
                        {item.target}
                      </Label>
                      <Progress
                        aria-labelledby={`achievement-label-${item.code}`}
                        id={`achievement-${item.code}`}
                        max={item.target}
                        value={Math.min(item.progress, item.target)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="evolution-context">
              Conquistas obtidas permanecem no histórico, mesmo ao excluir a
              origem ou desativar módulos. Criar conteúdo, revelar cartões e
              estudar partes de um bloco não geram um dia ativo. A IA é
              opcional.
            </p>
          </section>
        </>
      )}
    </section>
  );
}
