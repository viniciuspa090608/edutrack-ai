import { useEffect, useRef, useState } from 'react';
export function TaskConfirmation({
  title,
  description,
  action,
  returnFocusId,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  action: string;
  returnFocusId: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => {
      element.close();
      (
        document.getElementById(returnFocusId) ??
        document.getElementById('subtask-title')
      )?.focus();
    };
  }, [returnFocusId]);
  return (
    <dialog
      ref={dialog}
      className="task-dialog"
      aria-labelledby="subtask-confirm-heading"
      aria-describedby="subtask-confirm-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="subtask-confirm-heading">{title}</h2>
      <p id="subtask-confirm-description">{description}</p>
      {error && <p role="alert">{error}</p>}
      <div className="task-actions">
        <button autoFocus type="button" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
        <button
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
        </button>
      </div>
    </dialog>
  );
}
