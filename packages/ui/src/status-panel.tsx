import { Alert, AlertDescription, AlertTitle } from './components/ui/alert.js';
import { Button } from './components/ui/button.js';
import { Card, CardContent } from './components/ui/card.js';
import { Skeleton } from './components/ui/skeleton.js';

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
    <Card asChild>
      <section
        aria-live="polite"
        className={`status-panel status-panel--${tone}`}
      >
        <CardContent>
          <Alert
            role={tone === 'error' ? 'alert' : 'status'}
            variant={
              tone === 'error'
                ? 'destructive'
                : tone === 'success'
                  ? 'success'
                  : 'info'
            }
          >
            <AlertTitle>
              <h2>{title}</h2>
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
            {tone === 'loading' && (
              <Skeleton className="mt-3 h-2 w-2/3" aria-hidden="true" />
            )}
            {tone === 'error' && onRetry ? (
              <Button type="button" className="mt-4" onClick={onRetry}>
                Tentar novamente
              </Button>
            ) : null}
          </Alert>
        </CardContent>
      </section>
    </Card>
  );
}
