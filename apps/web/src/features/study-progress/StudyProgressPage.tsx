import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import { Card, CardContent } from '@study-platform/ui/components/ui/card';

import { Button } from '@study-platform/ui/components/ui/button';
import { Label } from '@study-platform/ui/components/ui/label';
import { Progress } from '@study-platform/ui/components/ui/progress';
import { useEffect, useState } from 'react';
import type { StudyProgress } from '@study-platform/contracts';
import { studyProgress } from './progress-api.js';
import '../../styles/study-progress.css';
const date = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone, dateStyle: 'medium' }).format(
    new Date(value),
  );
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
    <section className="study-progress" aria-labelledby="study-progress-title">
      <h1 id="study-progress-title">Seu progresso</h1>
      {error ? (
        <>
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </Button>
        </>
      ) : !data ? (
        <div>
          <Skeleton aria-hidden="true" className="my-2 h-3 w-2/3" />
          <p role="status">Carregando progresso…</p>
        </div>
      ) : (
        <>
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
          <dl className="progress-summary">
            <Card asChild>
              <div>
                <CardContent>
                  <dt>Sequência atual</dt>
                  <dd>{data.currentStreak} dias</dd>
                </CardContent>
              </div>
            </Card>
            <Card asChild>
              <div>
                <CardContent>
                  <dt>Maior sequência</dt>
                  <dd>{data.longestStreak} dias</dd>
                </CardContent>
              </div>
            </Card>
            <Card asChild>
              <div>
                <CardContent>
                  <dt>Dias ativos</dt>
                  <dd>{data.activeDays}</dd>
                </CardContent>
              </div>
            </Card>
          </dl>
          <p>
            A sequência atual continua se você estudou hoje ou ontem. Várias
            atividades na mesma data contam como um dia ativo.
          </p>
          {data.activeDays === 0 && (
            <p role="status">
              Seu primeiro dia ativo ainda está por vir. Conclua uma tarefa, um
              bloco Pomodoro de 25 minutos, uma avaliação de flashcard ou um
              marco de matéria.
            </p>
          )}
          <h2>Conquistas</h2>
          <ul className="progress-achievements">
            {data.achievements.map((item) => (
              <li key={item.code}>
                <h3>{item.name}</h3>
                <p>{item.criterion}</p>
                <p>
                  {item.earnedAt ? (
                    <>
                      Obtida em{' '}
                      <time dateTime={item.earnedAt}>
                        {date(item.earnedAt, data.timeZone)}
                      </time>
                    </>
                  ) : (
                    'Pendente'
                  )}
                </p>
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
              </li>
            ))}
          </ul>
          <p>
            Conquistas obtidas permanecem no histórico, mesmo ao excluir a
            origem ou desativar módulos. Criar conteúdo, revelar cartões e
            estudar partes de um bloco não geram um dia ativo. A IA é opcional.
          </p>
        </>
      )}
    </section>
  );
}
