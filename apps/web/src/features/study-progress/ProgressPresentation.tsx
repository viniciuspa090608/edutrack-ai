import type { ReactNode } from 'react';
import { Skeleton } from '@study-platform/ui/components/ui/skeleton';
import { ChartNoAxesCombined, Trophy } from 'lucide-react';
import '../../styles/progress-presentation.css';

export function ProgressHeader({
  title,
  description,
  current,
  titleId,
}: {
  title: string;
  description: string;
  current: 'progress' | 'analytics';
  titleId: string;
}) {
  return (
    <header className="evolution-header">
      <p className="evolution-eyebrow">Sua jornada de estudos</p>
      <h1 id={titleId}>{title}</h1>
      <p className="evolution-muted">{description}</p>
      <nav className="evolution-navigation" aria-label="Evolução e conquistas">
        <a
          href="/app/estatisticas"
          aria-current={current === 'analytics' ? 'page' : undefined}
        >
          <ChartNoAxesCombined aria-hidden="true" /> Estatísticas
        </a>
        <a
          href="/app/progresso"
          aria-current={current === 'progress' ? 'page' : undefined}
        >
          <Trophy aria-hidden="true" /> Progresso e conquistas
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
