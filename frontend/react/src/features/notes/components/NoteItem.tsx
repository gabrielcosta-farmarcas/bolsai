import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCalendarDate } from '@/lib/format';
import {
  useAddNoteAgreement,
  useChangeNoteAgreement,
  useDeleteNote,
  useUpdateNote,
} from '../hooks/useNotes';
import { KIND_LABEL, type Note } from '../types';
import { NoteAgreements } from './NoteAgreements';
import { NoteForm } from './NoteForm';

type NoteItemProps = { note: Note; defaultOpen?: boolean };

export function NoteItem({ note, defaultOpen = false }: NoteItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const update = useUpdateNote();
  const remove = useDeleteNote();
  const addAgreement = useAddNoteAgreement();
  const changeAgreement = useChangeNoteAgreement();

  const isResolved = note.status === 'resolved';
  const allDone = note.agreements.length > 0 && note.agreements.every((a) => a.status === 'done');
  const doneCount = note.agreements.filter((a) => a.status === 'done').length;
  const agreementsBusy = addAgreement.isPending || changeAgreement.isPending;
  const agreementsError = addAgreement.error?.message ?? changeAgreement.error?.message;

  return (
    <li className="bg-surface border-border rounded-lg border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="agreement">{KIND_LABEL[note.kind]}</StatusBadge>
            {isResolved ? <StatusBadge tone="growth">Resolvida</StatusBadge> : null}
            {note.bringToNextSession ? (
              <StatusBadge tone="growth">No próximo encontro</StatusBadge>
            ) : null}
          </div>
          <p className="text-text-muted mt-2 text-caption">{formatCalendarDate(note.notedAt)}</p>
          <p className="mt-1 whitespace-pre-line">{note.description}</p>
          {!isOpen && note.agreements.length > 0 ? (
            <p className="text-text-muted mt-1 text-body-sm">
              {doneCount} de {note.agreements.length} combinados feitos
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? 'Fechar' : 'Abrir'}
        </Button>
      </div>

      {isOpen ? (
        <div>
          {isEditing ? (
            <div className="mt-4">
              <NoteForm
                title="Editar anotação"
                submitLabel="Salvar"
                initialValues={{
                  kind: note.kind,
                  description: note.description,
                  notedAt: note.notedAt,
                }}
                isSaving={update.isPending}
                errorMessage={update.error?.message}
                onCancel={() => setIsEditing(false)}
                onSubmit={(patch) =>
                  update.mutate({ id: note.id, patch }, { onSuccess: () => setIsEditing(false) })
                }
              />
            </div>
          ) : null}

          <NoteAgreements
            agreements={note.agreements}
            isSaving={agreementsBusy}
            errorMessage={agreementsError}
            onAdd={(input, done) =>
              addAgreement.mutate({ noteId: note.id, input }, { onSuccess: done })
            }
            onToggle={(id, done) => changeAgreement.mutate({ id, status: done ? 'done' : 'open' })}
            onCancel={(id) => changeAgreement.mutate({ id, status: 'cancelled' })}
          />

          {allDone && !isResolved ? (
            <p role="status" className="bg-primary-subtle text-body-sm mt-4 rounded-lg p-3">
              Todos os combinados foram feitos. Quer marcar a anotação como resolvida?
            </p>
          ) : null}

          <div className="border-border mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                Editar anotação
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsConfirmingDelete(true)}>
                Excluir
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isResolved ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate({
                      id: note.id,
                      patch: { bringToNextSession: !note.bringToNextSession },
                    })
                  }
                >
                  {note.bringToNextSession
                    ? 'Tirar do próximo encontro'
                    : 'Levar para o próximo encontro'}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant={isResolved ? 'secondary' : 'primary'}
                disabled={update.isPending}
                onClick={() => update.mutate({ id: note.id, patch: { resolved: !isResolved } })}
              >
                {isResolved ? 'Reabrir' : 'Marcar como resolvida'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Excluir esta anotação?"
        description="A anotação deixa de aparecer. Os combinados criados a partir dela continuam na aba Combinados."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        isBusy={remove.isPending}
        errorMessage={remove.error?.message}
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={() => remove.mutate(note.id, { onSuccess: () => setIsConfirmingDelete(false) })}
      />
    </li>
  );
}
