import { useEffect, useState } from 'react';
import type {
  AnalyticsMetric,
  AnalyticsQuery,
  StudyAnalytics,
} from '@study-platform/contracts';
import { analyticsQuerySchema } from '@study-platform/contracts';
import { studyAnalytics } from './analytics-api.js';
import '../../styles/analytics.css';
const labels: Record<AnalyticsMetric, string> = {
  activeMs: 'Tempo ativo Pomodoro',
  pomodoroSessions: 'Sessões Pomodoro concluídas',
  tasks: 'Tarefas concluídas',
  reviews: 'Flashcards avaliados',
  planItems: 'Itens do plano manual concluídos',
  roadmapBlocks: 'Blocos de roadmap concluídos',
};
function value(metric: AnalyticsMetric, amount: number | null | undefined) {
  if (amount === null || amount === undefined) return 'Histórico indisponível';
  return metric === 'activeMs'
    ? `${(amount / 60000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`
    : amount.toLocaleString('pt-BR');
}
function defaults(): AnalyticsQuery {
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    /* Identified UTC fallback below. */
  }
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return { granularity: 'week', date, timeZone };
}
export function AnalyticsPage() {
  const [draft, setDraft] = useState(defaults);
  const [query, setQuery] = useState(draft);
  const [data, setData] = useState<StudyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setData(null);
    void studyAnalytics(query)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível carregar suas estatísticas. Tente novamente.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, retry]);
  useEffect(() => {
    const refresh = () => setRetry((value) => value + 1);
    window.addEventListener('edutrack:preferences', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('edutrack:preferences', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  const metrics = data ? (Object.keys(data.metrics) as AnalyticsMetric[]) : [];
  return (
    <section className="analytics-page">
      <h1>Estatísticas de estudo</h1>
      <form
        className="analytics-controls"
        onSubmit={(event) => {
          event.preventDefault();
          const result = analyticsQuerySchema.safeParse(draft);
          if (!result.success) {
            setError('Informe uma data e um fuso IANA válidos.');
            return;
          }
          setQuery(result.data);
        }}
      >
        <label>
          Período
          <select
            value={draft.granularity}
            onChange={(event) =>
              setDraft({
                ...draft,
                granularity: event.target
                  .value as AnalyticsQuery['granularity'],
              })
            }
          >
            {[
              ['day', 'Dia'],
              ['week', 'Semana'],
              ['quarter', 'Trimestre'],
              ['semester', 'Semestre'],
              ['year', 'Ano'],
            ].map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data de referência
          <input
            type="date"
            required
            value={draft.date}
            onChange={(event) =>
              setDraft({ ...draft, date: event.target.value })
            }
          />
        </label>
        <label>
          Fuso IANA
          <input
            required
            value={draft.timeZone}
            onChange={(event) =>
              setDraft({ ...draft, timeZone: event.target.value })
            }
            aria-describedby="analytics-zone-help"
          />
        </label>
        <button type="submit">Consultar</button>
      </form>
      <p id="analytics-zone-help">
        Fuso selecionado: {query.timeZone}. UTC é usado quando o navegador não
        informa um fuso. Exemplo: America/Sao_Paulo.
      </p>
      {loading && <p role="status">Carregando estatísticas…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {data && (
        <>
          <p>
            Período: {data.period.start} até {data.period.end} (fim exclusivo),
            em {data.timeZone}.
          </p>
          <p>
            Comparação: {data.previousPeriod.start} até{' '}
            {data.previousPeriod.end} (fim exclusivo).
          </p>
          {data.period.partial && (
            <p>
              Período atual parcial, comparado ao período anterior completo.
            </p>
          )}
          <p>
            Frequência: {data.frequency.activeDays} dias ativos em{' '}
            {data.frequency.days} dias transcorridos.
            {data.frequency.status === 'history_unavailable' &&
              ' Histórico incompleto: a frequência mostra apenas atividades registradas.'}
          </p>
          {data.frequency.activeDays === 0 && (
            <p>
              {data.frequency.status === 'available'
                ? 'Nenhuma atividade neste período.'
                : 'Nenhuma atividade registrada; o histórico anterior ao início da cobertura está indisponível.'}
            </p>
          )}
          <p>
            Métricas de módulos desativados são omitidas.{' '}
            <a href="/conta">Ver preferências</a>
          </p>
          <div className="analytics-cards">
            {metrics.map((metric) => {
              const item = data.metrics[metric]!;
              return (
                <article key={metric}>
                  <h2>{labels[metric]}</h2>
                  <p>Atual: {value(metric, item.current)}</p>
                  <p>Anterior: {value(metric, item.previous)}</p>
                  <p>Diferença: {value(metric, item.difference)}</p>
                  <p>
                    Variação:{' '}
                    {item.percent === null
                      ? 'Não calculável'
                      : `${item.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
                  </p>
                  <p>
                    Cobertura completa a partir de{' '}
                    {new Date(item.coverageStart).toLocaleString('pt-BR', {
                      timeZone: data.timeZone,
                    })}
                    .
                  </p>
                </article>
              );
            })}
          </div>
          <h2>Série diária</h2>
          <p>
            Valores ausentes indicam histórico indisponível. Valores registrados
            antes da cobertura completa são amostras e podem estar incompletos.
          </p>
          <ol className="analytics-series">
            {data.series.map((day) => (
              <li key={day.date}>
                <h3>{day.date}</h3>
                <dl>
                  {metrics.map((metric) => (
                    <div key={metric}>
                      <dt>{labels[metric]}</dt>
                      <dd>{value(metric, day.values[metric])}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
