export interface StatusPanelProps {
  title: string;
  message: string;
  tone: 'loading' | 'success' | 'error';
  onRetry?: () => void;
}

export function StatusPanel({
  title,
  message,
  tone,
  onRetry,
}: StatusPanelProps) {
  return (
    <section
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`status-panel status-panel--${tone}`}
    >
      <h2>{title}</h2>
      <p>{message}</p>
      {tone === 'error' && onRetry ? (
        <button type="button" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </section>
  );
}
