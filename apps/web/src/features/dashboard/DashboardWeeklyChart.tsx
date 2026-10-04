import type { StudyAnalytics } from '@study-platform/contracts';

export function DashboardWeeklyChart({
  series,
}: {
  series: StudyAnalytics['series'];
}) {
  const maximum = Math.max(0, ...series.map((day) => day.values.activeMs ?? 0));
  if (!series.length)
    return <p>Sem observações diárias disponíveis para o gráfico.</p>;
  return (
    <figure className="dashboard-chart" aria-labelledby="dashboard-chart-title">
      <figcaption id="dashboard-chart-title">
        Tempo de foco por dia · minutos
      </figcaption>
      <ol className="dashboard-chart-days">
        {series.map((day) => {
          const value = day.values.activeMs;
          const label =
            value === undefined
              ? 'Indisponível'
              : `${(value / 60000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} min`;
          return (
            <li key={day.date}>
              <div className="dashboard-chart-track" aria-hidden="true">
                {value !== undefined && (
                  <div
                    className="dashboard-chart-bar"
                    style={{
                      height: `${maximum > 0 ? (value / maximum) * 100 : 0}%`,
                    }}
                  />
                )}
              </div>
              <time dateTime={day.date}>
                {day.date.slice(8)}/{day.date.slice(5, 7)}
              </time>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>
      <p>
        Valores ausentes indicam histórico indisponível. Observações anteriores
        à cobertura completa podem estar incompletas.
      </p>
    </figure>
  );
}
