import { useEffect, useRef } from 'react';
import { Button } from './Button';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isBusy?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// <dialog> nativo: prende o foco, fecha com Escape e devolve o foco a quem abriu.
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isBusy = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="bg-surface text-text m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl p-6 backdrop:bg-text/40"
    >
      <h2 id="confirm-title">{title}</h2>
      <p className="text-text-muted mt-2">{description}</p>
      {errorMessage ? (
        <p role="alert" className="text-danger mt-3 text-body-sm">
          {errorMessage}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={isBusy}>
          {cancelLabel}
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isBusy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
