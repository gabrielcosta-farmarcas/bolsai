import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';

export type DialogProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

// <dialog> nativo: prende o foco, fecha com Escape e devolve o foco a quem abriu.
export function Dialog({ isOpen, title, onClose, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="bg-surface text-text m-auto max-h-[85vh] w-[min(40rem,calc(100vw-2rem))] overflow-auto rounded-xl p-6 backdrop:bg-text/40"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-h3">
          {title}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
      {children}
    </dialog>
  );
}
