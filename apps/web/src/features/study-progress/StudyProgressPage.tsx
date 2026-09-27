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
          <p role="alert">{error}</p>
          <button onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </button>
        </>
      ) : !data ? (
        <p role="status">Carregando progresso…</p>
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
            <div>
              <dt>Sequência atual</dt>
              <dd>{data.currentStreak} dias</dd>
            </div>
            <div>
              <dt>Maior sequência</dt>
              <dd>{data.longestStreak} dias</dd>
            </div>
            <div>
              <dt>Dias ativos</dt>
              <dd>{data.activeDays}</dd>
            </div>
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
                <label htmlFor={`achievement-${item.code}`}>
                  Progresso: {Math.min(item.progress, item.target)} de{' '}
                  {item.target}
                </label>
                <progress
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
