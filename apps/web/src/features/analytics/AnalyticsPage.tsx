import {
  CalendarDays,
  ChartNoAxesCombined,
  CheckCheck,
  Layers,
  ListChecks,
  Milestone,
  Timer,
} from 'lucide-react';
import { Badge } from '@study-platform/ui/components/ui/badge';
import {
  ProgressEmpty,
  ProgressHeader,
  ProgressLoading,
} from '../study-progress/ProgressPresentation.js';
import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@study-platform/ui/components/ui/select';
import { Label } from '@study-platform/ui/components/ui/label';

import { Input } from '@study-platform/ui/components/ui/input';
import { Button } from '@study-platform/ui/components/ui/button';

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
const metricIcons = {
  activeMs: Timer,
  pomodoroSessions: Timer,
  tasks: CheckCheck,
  reviews: Layers,
  planItems: ListChecks,
  roadmapBlocks: Milestone,
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
function DailyChart({
  metric,
  data,
}: {
  metric: AnalyticsMetric;
  data: StudyAnalytics;
}) {
  const maximum = Math.max(
    1,
    ...data.series.map((day) => day.values[metric] ?? 0),
  );
  const hasValues = data.series.some((day) => day.values[metric] !== undefined);
  return (
    <figure
      className="evolution-card analytics-chart"
      aria-labelledby={`chart-${metric}`}
    >
      <figcaption id={`chart-${metric}`}>
        <ChartNoAxesCombined aria-hidden="true" />
        {labels[metric]}
      </figcaption>
      <p className="analytics-chart-legend">
        {metric === 'activeMs' ? 'Minutos por dia' : 'Quantidade por dia'} ·
        Valores diários, sem agrupamento
      </p>
      {!hasValues ? (
        <p className="evolution-muted">
          Sem valores disponíveis para este gráfico.
        </p>
      ) : (
        <div
          className="analytics-chart-scroll"
          role="region"
          tabIndex={0}
          aria-label={`Série diária: ${labels[metric]}`}
          aria-describedby="analytics-chart-help"
        >
          <div className="analytics-bars">
            {data.series.map((day) => {
              const amount = day.values[metric];
              return (
                <div className="analytics-sample" key={day.date}>
                  <span className="analytics-sample-value">
                    {amount === undefined ? '—' : value(metric, amount)}
                  </span>
                  <div className="analytics-plot" aria-hidden="true">
                    {amount === undefined ? (
                      <span className="analytics-missing">?</span>
                    ) : (
                      <span
                        className={`analytics-bar${amount === 0 ? ' analytics-bar-zero' : ''}`}
                        style={{ height: `${(amount / maximum) * 100}%` }}
                      />
                    )}
                  </div>
                  <time dateTime={day.date}>{day.date}</time>
                  {amount === undefined && (
                    <span className="analytics-sample-unavailable">
                      Indisponível
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="analytics-coverage">
        Cobertura completa a partir de{' '}
        {new Date(data.metrics[metric]!.coverageStart).toLocaleString('pt-BR', {
          timeZone: data.timeZone,
        })}
        . Valores anteriores são amostras e podem estar incompletos.
      </p>
    </figure>
  );
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
  const metrics = data
    ? (Object.keys(data.metrics) as AnalyticsMetric[]).sort((a, b) =>
        a === 'activeMs' ? -1 : b === 'activeMs' ? 1 : 0,
      )
    : [];
  return (
    <section
      className="analytics-page evolution-surface"
      aria-labelledby="analytics-title"
    >
      <ProgressHeader
        title="Estatísticas de estudo"
        titleId="analytics-title"
        current="analytics"
        description="Entenda seu ritmo de estudos e acompanhe a evolução das suas atividades ao longo do tempo."
      />
      <form
        className="analytics-controls evolution-card"
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
        <div>
          <Label htmlFor="analytics-period">Período</Label>
          <Select
            value={draft.granularity}
            onValueChange={(value) =>
              setDraft({
                ...draft,
                granularity: value as AnalyticsQuery['granularity'],
              })
            }
          >
            <SelectTrigger id="analytics-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="analytics-period-options">
              {[
                ['day', 'Dia'],
                ['week', 'Semana'],
                ['quarter', 'Trimestre'],
                ['semester', 'Semestre'],
                ['year', 'Ano'],
              ].map(([id, label]) => (
                <SelectItem key={id} value={id!}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Label>
          Data de referência
          <Input
            type="date"
            required
            value={draft.date}
            onChange={(event) =>
              setDraft({ ...draft, date: event.target.value })
            }
          />
        </Label>
        <Label>
          Fuso IANA
          <Input
            required
            value={draft.timeZone}
            onChange={(event) =>
              setDraft({ ...draft, timeZone: event.target.value })
            }
            aria-describedby="analytics-zone-help"
          />
        </Label>
        <Button type="submit">Consultar</Button>
      </form>
      <p id="analytics-zone-help" className="evolution-context">
        Fuso selecionado: {query.timeZone}. UTC é usado quando o navegador não
        informa um fuso. Exemplo: America/Sao_Paulo.
      </p>
      {loading && <ProgressLoading>Carregando estatísticas…</ProgressLoading>}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            <p>{error}</p>
            <Button onClick={() => setRetry((value) => value + 1)}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {data && (
        <>
          <div className="evolution-card evolution-context analytics-period-context">
            <p>
              Período: {data.period.start} até {data.period.end} (fim
              exclusivo), em {data.timeZone}.
            </p>
            <p>
              Comparação: {data.previousPeriod.start} até{' '}
              {data.previousPeriod.end} (fim exclusivo).
            </p>
            {data.period.partial && (
              <p className="analytics-partial">
                Período atual parcial, comparado ao período anterior completo.
              </p>
            )}
          </div>
          <div className="evolution-card analytics-frequency">
            <span className="evolution-icon">
              <CalendarDays aria-hidden="true" />
            </span>
            <div>
              <h2>Frequência de estudo</h2>
              <p>
                Frequência: {data.frequency.activeDays} dias ativos em{' '}
                {data.frequency.days} dias transcorridos.
                {data.frequency.status === 'history_unavailable' &&
                  ' Histórico incompleto: a frequência mostra apenas atividades registradas.'}
              </p>
            </div>
          </div>
          {data.frequency.activeDays === 0 && (
            <ProgressEmpty title="Seu ritmo de estudo">
              {data.frequency.status === 'available'
                ? 'Nenhuma atividade neste período.'
                : 'Nenhuma atividade registrada; o histórico anterior ao início da cobertura está indisponível.'}
            </ProgressEmpty>
          )}
          <p className="evolution-context">
            Métricas de módulos desativados são omitidas.{' '}
            <a href="/conta">Ver preferências</a>
          </p>
          <div className="analytics-cards evolution-metrics">
            {metrics.map((metric) => {
              const item = data.metrics[metric]!;
              const Icon = metricIcons[metric];
              return (
                <article
                  key={metric}
                  className={`evolution-card analytics-metric${metric === 'activeMs' ? ' analytics-metric-featured' : ''}`}
                  aria-labelledby={`metric-${metric}`}
                >
                  <span className="evolution-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <h2 id={`metric-${metric}`}>{labels[metric]}</h2>
                  <p
                    className={`analytics-current${item.current === null ? ' analytics-unavailable' : ''}`}
                  >
                    <span>Atual: </span>
                    {value(metric, item.current)}
                  </p>
                  <div className="analytics-comparison">
                    <p>Anterior: {value(metric, item.previous)}</p>
                    <p>Diferença: {value(metric, item.difference)}</p>
                  </div>
                  <p className="analytics-variation">
                    Variação:{' '}
                    <Badge variant="outline">
                      {item.percent === null
                        ? 'Não calculável'
                        : `${item.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
                    </Badge>
                  </p>
                  <p className="analytics-coverage">
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
          <section aria-labelledby="analytics-series-title">
            <div className="evolution-section-heading">
              <div>
                <p className="evolution-eyebrow">Evolução ao longo do tempo</p>
                <h2 id="analytics-series-title">Série diária</h2>
              </div>
            </div>
            <p className="evolution-context" id="analytics-chart-help">
              Role cada gráfico para explorar as datas. Valores ausentes são
              indicados por — e ?. Consulte todos os valores em texto abaixo.
            </p>
            <p className="evolution-context">
              Valores ausentes indicam histórico indisponível. Valores
              registrados antes da cobertura completa são amostras e podem estar
              incompletos.
            </p>
            <div className="analytics-charts">
              {metrics.map((metric) => (
                <DailyChart key={metric} metric={metric} data={data} />
              ))}
            </div>
            <h3 className="analytics-text-title">Valores diários em texto</h3>
            <ol className="analytics-series">
              {data.series.map((day) => (
                <li key={day.date} className="evolution-card">
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
          </section>
        </>
      )}
    </section>
  );
}
