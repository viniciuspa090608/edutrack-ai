import { useEffect, useId, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Button } from '@study-platform/ui/components/ui/button';
import type { StudyAnalytics, StudyProgress } from '@study-platform/contracts';
import { studyAnalytics } from '../analytics/analytics-api.js';
import { AnalyticsContent } from '../analytics/AnalyticsPage.js';
import { StudyProgressContent } from './StudyProgressPage.js';
import { studyProgress } from './progress-api.js';
import { analyticsDefaults, appliedAnalyticsQuery } from './report-query.js';

type ReportData = { progress: StudyProgress; analytics: StudyAnalytics };
type Snapshot = ReportData & { generatedAt: Date };

export function UnifiedReportPrint() {
  const reasonId = useId();
  const [query, setQuery] = useState(
    () => appliedAnalyticsQuery() ?? analyticsDefaults(),
  );
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [logoReady, setLogoReady] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const changed = () =>
      setQuery(appliedAnalyticsQuery() ?? analyticsDefaults());
    const refresh = () => {
      if (!snapshotRef.current) setRevision((value) => value + 1);
    };
    window.addEventListener('edutrack:report-query', changed);
    window.addEventListener('edutrack:preferences', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('edutrack:report-query', changed);
      window.removeEventListener('edutrack:preferences', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  useEffect(() => {
    let active = true;
    setData(null);
    setError('');
    void Promise.all([studyProgress(), studyAnalytics(query)])
      .then(([progress, analytics]) => {
        if (active) setData({ progress, analytics });
      })
      .catch(() => {
        if (active) setError('Não foi possível preparar o relatório completo.');
      });
    return () => {
      active = false;
    };
  }, [query, revision]);
  const reason =
    error ||
    (!data || !logoReady
      ? 'Aguarde o carregamento do relatório completo para imprimir.'
      : data.progress.activeDays === 0 &&
          data.analytics.frequency.activeDays === 0
        ? 'Nenhuma atividade para imprimir.'
        : '');
  useEffect(() => {
    const prepare = () => {
      if (reason || !data || snapshotRef.current) return;
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const next = { ...data, generatedAt: new Date() };
      snapshotRef.current = next;
      flushSync(() => setSnapshot(next));
      document.body.setAttribute('data-unified-printing', '');
    };
    const restore = () => {
      snapshotRef.current = null;
      setSnapshot(null);
      document.body.removeAttribute('data-unified-printing');
      opener.current?.focus({ preventScroll: true });
    };
    window.addEventListener('beforeprint', prepare);
    window.addEventListener('afterprint', restore);
    return () => {
      window.removeEventListener('beforeprint', prepare);
      window.removeEventListener('afterprint', restore);
      document.body.removeAttribute('data-unified-printing');
      snapshotRef.current = null;
    };
  }, [data, reason]);
  return (
    <div className="unified-print-action">
      <img
        key={revision}
        src="/favicon.png"
        alt=""
        hidden
        onLoad={() => setLogoReady(true)}
        onError={() =>
          setError('Não foi possível carregar a logo do relatório.')
        }
      />
      <Button
        type="button"
        className="report-print-button"
        disabled={Boolean(reason)}
        aria-describedby={reason ? reasonId : undefined}
        onClick={() => {
          window.dispatchEvent(new Event('beforeprint'));
          try {
            window.print();
          } catch {
            window.dispatchEvent(new Event('afterprint'));
            setError('Não foi possível abrir a impressão. Tente novamente.');
          }
        }}
      >
        Imprimir relatório
      </Button>
      <p
        id={reasonId}
        className="report-print-reason evolution-muted"
        role="status"
      >
        {reason}
      </p>
      {error && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setRevision((value) => value + 1);
          }}
        >
          Tentar preparar relatório novamente
        </Button>
      )}
      {snapshot &&
        createPortal(<UnifiedReport snapshot={snapshot} />, document.body)}
    </div>
  );
}

function UnifiedReport({ snapshot }: { snapshot: Snapshot }) {
  const { progress, analytics, generatedAt } = snapshot;
  const generated = generatedAt.toLocaleString('pt-BR', {
    timeZone: analytics.timeZone,
    dateStyle: 'short',
    timeStyle: 'short',
  });
  return (
    <article
      className="study-report evolution-surface unified-study-report"
      style={{ display: 'none' }}
      aria-label="Relatório unificado de estudos"
    >
      <style media="print">{`@page study-report { @bottom-center { content: ${JSON.stringify(`${generated} · ${analytics.timeZone}`)}; font: 8pt sans-serif; color: #42556e; } }`}</style>
      <header className="unified-report-header">
        <div className="unified-report-brand">
          <img src="/favicon.png" alt="Logo EduTrack" width="36" height="36" />{' '}
          <strong>EduTrack</strong>
          <span>Relatório integrado</span>
        </div>
        <h1>Relatório de estudos</h1>
        <p>Desempenho, constância e conquistas em uma única visão.</p>
        <p>
          Gerado em{' '}
          <time dateTime={generatedAt.toISOString()}>{generated}</time> ·{' '}
          {analytics.timeZone}
        </p>
      </header>
      <section className="unified-report-progress" aria-label="Progresso">
        <h2 className="unified-section-title">01 · Progresso e conquistas</h2>
        <StudyProgressContent data={progress} />
      </section>
      <section className="unified-report-analytics" aria-label="Estatísticas">
        <h2 className="unified-section-title">02 · Estatísticas de estudo</h2>
        <AnalyticsContent data={analytics} printing />
      </section>
    </article>
  );
}
