import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '@study-platform/ui/components/ui/button';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import { ChartNoAxesCombined, Trophy } from 'lucide-react';
import '../../styles/progress-presentation.css';
import '../../styles/study-report-print.css';

export function ProgressHeader({
  title,
  description,
  current,
  titleId,
  printUnavailable,
  printPeriod,
  timeZone,
}: {
  title: string;
  description: string;
  current: 'progress' | 'analytics';
  titleId: string;
  printUnavailable: string;
  printPeriod?: string | undefined;
  timeZone?: string | undefined;
}) {
  const reasonId = useId();
  const generatedAt = useRef<HTMLTimeElement>(null);

  useEffect(() => {
    if (printUnavailable) return;
    const timestamp = generatedAt.current;
    const report = timestamp?.closest('.study-report');
    const details = report?.querySelector<HTMLDetailsElement>(
      '.analytics-daily-details',
    );
    let restoreCollapsed = false;
    const prepare = () => {
      if (!timestamp || !report || report.hasAttribute('data-printing')) return;
      const now = new Date();
      timestamp.dateTime = now.toISOString();
      timestamp.textContent = now.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone,
      });
      report.setAttribute('data-printing', '');
      if (details && !details.open) {
        restoreCollapsed = true;
        details.open = true;
      }
    };
    const restore = () => {
      if (details && restoreCollapsed) details.open = false;
      restoreCollapsed = false;
      report?.removeAttribute('data-printing');
    };
    window.addEventListener('beforeprint', prepare);
    window.addEventListener('afterprint', restore);
    return () => {
      window.removeEventListener('beforeprint', prepare);
      window.removeEventListener('afterprint', restore);
      restore();
    };
  }, [printUnavailable, printPeriod, timeZone]);

  return (
    <header className="evolution-header">
      <p className="evolution-eyebrow">Sua jornada de estudos</p>
      <div className="evolution-title-row">
        <h1 id={titleId}>{title}</h1>
        <Button
          type="button"
          className="report-print-button"
          disabled={Boolean(printUnavailable)}
          aria-describedby={printUnavailable ? reasonId : undefined}
          onClick={() => window.print()}
        >
          Imprimir relatório
        </Button>
      </div>
      <p
        id={reasonId}
        className="report-print-reason evolution-muted"
        role="status"
      >
        {printUnavailable}
      </p>
      <div className="report-print-metadata">
        {printPeriod && <p>Período: {printPeriod}</p>}
        <p>
          Gerado em <time ref={generatedAt} />
          {timeZone && ` (${timeZone})`}
        </p>
      </div>
      <p className="evolution-muted">{description}</p>
      <nav className="evolution-navigation" aria-label="Abas de Relatório">
        <a
          href="/app/progresso"
          aria-current={current === 'progress' ? 'page' : undefined}
        >
          <Trophy aria-hidden="true" /> Progresso
        </a>
        <a
          href="/app/estatisticas"
          aria-current={current === 'analytics' ? 'page' : undefined}
        >
          <ChartNoAxesCombined aria-hidden="true" /> Estatísticas
        </a>
      </nav>
    </header>
  );
}

export function ProgressLoading({ children }: { children: ReactNode }) {
  return (
    <div className="evolution-loading">
      <p role="status">{children}</p>
      <div className="evolution-metrics" aria-hidden="true">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="evolution-skeleton" />
        ))}
      </div>
    </div>
  );
}

export function ProgressEmpty({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="evolution-empty">
      <span className="evolution-icon">
        <Trophy aria-hidden="true" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
