import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDeleteSession } from '../hooks/useSessions';

type DeleteSessionButtonProps = { sessionId: string; directReportId: string };

export function DeleteSessionButton({ sessionId, directReportId }: DeleteSessionButtonProps) {
  const navigate = useNavigate();
  const remove = useDeleteSession(sessionId);
  const [isOpen, setIsOpen] = useState(false);

  const close = () => {
    setIsOpen(false);
    remove.reset();
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        Apagar encontro
      </Button>
      <ConfirmDialog
        isOpen={isOpen}
        title="Apagar este encontro?"
        description="O encontro e tudo que saiu dele (transcrição, resumo, combinados, evolução, perguntas, seu feedback e notas privadas) serão apagados de vez. Não dá para desfazer."
        confirmLabel="Apagar"
        cancelLabel="Cancelar"
        isBusy={remove.isPending}
        errorMessage={remove.error?.message}
        onCancel={close}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () =>
              void navigate(`/pessoas/${directReportId}`, { state: { sessionDeleted: true } }),
          })
        }
      />
    </>
  );
}
