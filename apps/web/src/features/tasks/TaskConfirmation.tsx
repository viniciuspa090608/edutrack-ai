import {
  AlertDescription,
  Alert,
} from '@study-platform/ui/components/ui/alert';

import { Button } from '@study-platform/ui/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@study-platform/ui/components/ui/alert-dialog';
import { useRef, useState } from 'react';
export function TaskConfirmation({
  title,
  description,
  action,
  returnFocusId,
  onConfirm,
  onCancel,
  destructive = true,
}: {
  title: string;
  description: string;
  action: string;
  returnFocusId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  destructive?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
    >
      <AlertDialogContent
        className="tasks-surface task-confirmation"
        aria-labelledby="subtask-confirm-heading"
        aria-describedby="subtask-confirm-description"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          if (!busy) onCancel();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          (
            document.getElementById(returnFocusId) ??
            document.getElementById('subtask-title')
          )?.focus();
        }}
      >
        <AlertDialogTitle id="subtask-confirm-heading">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription id="subtask-confirm-description">
          {description}
        </AlertDialogDescription>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="task-actions">
          <Button
            variant="outline"
            autoFocus
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            type="button"
            disabled={busy}
            onClick={async () => {
              if (submitting.current) return;
              submitting.current = true;
              setBusy(true);
              setError('');
              try {
                await onConfirm();
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : 'Não foi possível concluir a ação. Tente novamente.',
                );
              } finally {
                submitting.current = false;
                setBusy(false);
              }
            }}
          >
            {busy ? 'Aguarde…' : action}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
