import { useRef, useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog.js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from './alert-dialog.js';
import { Button } from './button.js';

/** Features retain ownership of their values, validation and mutations. */
export function FormModal({
  title,
  dirty,
  busy,
  onClose,
  children,
}: {
  title: string;
  dirty: boolean;
  busy: boolean;
  onClose: () => void;
  children: (requestClose: () => void) => ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirming(true);
    else onClose();
  };
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) requestClose();
        }}
      >
        <DialogContent
          ref={region}
          showCloseButton={false}
          className="form-modal"
          aria-busy={busy}
          onOpenAutoFocus={(event) => {
            const first = region.current?.querySelector<HTMLElement>(
              'input:not([disabled]), textarea:not([disabled]), select:not([disabled])',
            );
            if (first) {
              event.preventDefault();
              first.focus();
            }
          }}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            requestClose();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener?.isConnected) opener.focus();
            else
              document
                .querySelector<HTMLElement>(
                  'main[tabindex="-1"], main [tabindex="-1"]',
                )
                ?.focus();
          }}
        >
          <DialogTitle asChild>
            <span className="sr-only">{title}</span>
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="form-modal-close"
            aria-label="Fechar formulário"
            disabled={busy}
            onClick={requestClose}
          >
            ×
          </Button>
          <DialogDescription className="sr-only">
            Preencha os dados e salve ou cancele.
          </DialogDescription>
          {busy && <p role="status">Salvando…</p>}
          {children(requestClose)}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            region.current
              ?.querySelector<HTMLElement>('input, textarea, button')
              ?.focus();
          }}
        >
          <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
          <AlertDialogDescription>
            Os dados preenchidos serão perdidos.
          </AlertDialogDescription>
          <AlertDialogCancel>Continuar preenchendo</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setConfirming(false);
              onClose();
            }}
          >
            Descartar alterações
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
