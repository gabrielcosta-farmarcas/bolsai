import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCalendarDate } from '@/lib/format';
import {
  useAddStep,
  useDeleteNote,
  usePromoteStep,
  useRemoveStep,
  useUpdateNote,
  useUpdateStep,
} from '../hooks/useNotes';
import { KIND_LABEL, type Note, type NoteStatus } from '../types';
import { NoteForm } from './NoteForm';
import { PlanSteps } from './PlanSteps';

const STATUS_LABEL: Record<
  NoteStatus,
  { label: string; tone: 'attention' | 'neutral' | 'growth' }
> = {
  no_plan: { label: 'Sem plano ainda', tone: 'attention' },
  in_progress: { label: 'Plano em andamento', tone: 'neutral' },
  resolved: { label: 'Resolvida', tone: 'growth' },
};

type NoteItemProps = { note: Note; defaultOpen?: boolean };

export function NoteItem({ note, defaultOpen = false }: NoteItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const update = useUpdateNote();
  const remove = useDeleteNote();
  const addStep = useAddStep();
  const updateStep = useUpdateStep();
  const removeStep = useRemoveStep();
  const promote = usePromoteStep();

  const status = STATUS_LABEL[note.status];
  const allDone = note.progress.total > 0 && note.progress.done === note.progress.total;
  const isResolved = note.status === 'resolved';
  const stepsBusy =
    addStep.isPending || updateStep.isPending || removeStep.isPending || promote.isPending;
  const stepsError =
    addStep.error?.message ??
    updateStep.error?.message ??
    removeStep.error?.message ??
    promote.error?.message;

  return (
    <li className="bg-surface border-border rounded-lg border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="agreement">{KIND_LABEL[note.kind]}</StatusBadge>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            {note.bringToNextSession ? (
              <StatusBadge tone="growth">No próximo encontro</StatusBadge>
            ) : null}
          </div>
          <p className="text-text-muted mt-2 text-caption">{formatCalendarDate(note.notedAt)}</p>
          <p className="mt-1 whitespace-pre-line">{note.description}</p>
          {!isOpen && note.progress.total > 0 ? (
            <p className="text-text-muted mt-1 text-body-sm">
              {note.progress.done} de {note.progress.total} feitos
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? 'Fechar' : 'Abrir plano'}
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

          <PlanSteps
            note={note}
            isSaving={stepsBusy}
            errorMessage={stepsError}
            onAdd={(input, done) => addStep.mutate({ noteId: note.id, input }, { onSuccess: done })}
            onChange={(stepId, patch, done) =>
              updateStep.mutate({ noteId: note.id, stepId, patch }, { onSuccess: done })
            }
            onRemove={(stepId) => removeStep.mutate({ noteId: note.id, stepId })}
            onPromote={(stepId) => promote.mutate({ noteId: note.id, stepId })}
          />

          {allDone && !isResolved ? (
            <p role="status" className="bg-primary-subtle text-body-sm mt-4 rounded-lg p-3">
              Todos os passos foram feitos. Quer marcar a anotação como resolvida?
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
        description="A anotação e o plano de ação dela deixam de aparecer. Combinados já criados a partir dos passos continuam."
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
