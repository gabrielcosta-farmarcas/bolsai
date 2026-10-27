import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { formatCalendarDate } from '@/lib/format';
import { OWNER_LABEL, type Note, type NoteStep, type StepInput, type StepPatch } from '../types';
import { StepForm } from './StepForm';

type PlanStepsProps = {
  note: Note;
  isSaving: boolean;
  errorMessage?: string;
  onAdd: (input: StepInput, done: () => void) => void;
  onChange: (stepId: string, patch: StepPatch, done?: () => void) => void;
  onRemove: (stepId: string) => void;
  onPromote: (stepId: string) => void;
};

function StepMeta({ step }: { step: NoteStep }) {
  const parts = [
    step.dueDate ? `Até ${formatCalendarDate(step.dueDate)}` : null,
    OWNER_LABEL[step.owner],
    step.done && step.doneAt ? `Feito em ${formatCalendarDate(step.doneAt.slice(0, 10))}` : null,
  ].filter(Boolean);
  return <p className="text-text-muted text-caption">{parts.join(' · ')}</p>;
}

export function PlanSteps({
  note,
  isSaving,
  errorMessage,
  onAdd,
  onChange,
  onRemove,
  onPromote,
}: PlanStepsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string>();

  return (
    <section aria-label="Plano de ação" className="mt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-h3">Plano de ação</h3>
        {note.progress.total > 0 ? (
          <p className="text-text-muted text-body-sm">
            {note.progress.done} de {note.progress.total} feitos
          </p>
        ) : null}
      </div>

      {note.steps.length === 0 && !isAdding ? (
        <p className="text-text-muted mt-2 text-body-sm">
          Ainda sem passos. Pense no que você pode fazer a respeito e vá adicionando.
        </p>
      ) : null}

      <ul className="mt-2">
        {note.steps.map((step) =>
          editingId === step.id ? (
            <li key={step.id} className="border-border border-t">
              <StepForm
                submitLabel="Salvar passo"
                initialValues={{ text: step.text, dueDate: step.dueDate, owner: step.owner }}
                isSaving={isSaving}
                onCancel={() => setEditingId(undefined)}
                onSubmit={(input) => onChange(step.id, input, () => setEditingId(undefined))}
              />
            </li>
          ) : (
            <li key={step.id} className="border-border flex items-start gap-3 border-t py-3">
              <input
                type="checkbox"
                aria-label={`Marcar como feito: ${step.text}`}
                checked={step.done}
                onChange={(event) => onChange(step.id, { done: event.target.checked })}
                className="accent-primary mt-1 size-4 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className={cn(step.done && 'text-text-muted line-through')}>{step.text}</p>
                <StepMeta step={step} />
                <div className="mt-1 flex flex-wrap gap-2">
                  {step.isOverdue ? <StatusBadge tone="attention">Atrasado</StatusBadge> : null}
                  {step.agreementId ? <StatusBadge tone="agreement">Combinado</StatusBadge> : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                {!step.agreementId ? (
                  <Button variant="ghost" size="sm" onClick={() => onPromote(step.id)}>
                    Virar combinado
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" onClick={() => setEditingId(step.id)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onRemove(step.id)}>
                  Remover
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>

      {errorMessage ? (
        <p role="alert" className="text-danger mt-2 text-body-sm">
          {errorMessage}
        </p>
      ) : null}

      <div className="border-border border-t pt-3">
        {isAdding ? (
          <StepForm
            submitLabel="Adicionar passo"
            isSaving={isSaving}
            onCancel={() => setIsAdding(false)}
            onSubmit={(input) => onAdd(input, () => setIsAdding(false))}
          />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
            Adicionar passo
          </Button>
        )}
      </div>
    </section>
  );
}
