import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { formatCalendarDate } from '@/lib/format';
import { OWNER_LABEL, type NoteAgreement, type NoteAgreementInput } from '../types';
import { NoteAgreementForm } from './NoteAgreementForm';

type NoteAgreementsProps = {
  agreements: NoteAgreement[];
  isSaving: boolean;
  errorMessage?: string;
  onAdd: (input: NoteAgreementInput, done: () => void) => void;
  onToggle: (id: string, done: boolean) => void;
  onCancel: (id: string) => void;
};

function Meta({ agreement }: { agreement: NoteAgreement }) {
  const parts = [
    agreement.dueDate ? `Até ${formatCalendarDate(agreement.dueDate)}` : null,
    OWNER_LABEL[agreement.owner],
  ].filter(Boolean);
  return <p className="text-text-muted text-caption">{parts.join(' · ')}</p>;
}

// Combinados criados a partir da anotação. São os mesmos da aba Combinados da pessoa.
export function NoteAgreements({
  agreements,
  isSaving,
  errorMessage,
  onAdd,
  onToggle,
  onCancel,
}: NoteAgreementsProps) {
  const [isAdding, setIsAdding] = useState(false);

  return (
    <section aria-label="Combinados desta anotação" className="mt-5">
      <h3 className="text-h3">Combinados desta anotação</h3>

      {agreements.length === 0 && !isAdding ? (
        <p className="text-text-muted mt-2 text-body-sm">
          Ainda sem combinados. Quando decidir o que fazer a respeito, registre aqui.
        </p>
      ) : null}

      <ul className="mt-2">
        {agreements.map((agreement) => {
          const isDone = agreement.status === 'done';
          return (
            <li key={agreement.id} className="border-border flex items-start gap-3 border-t py-3">
              <input
                type="checkbox"
                aria-label={`Marcar como feito: ${agreement.description}`}
                checked={isDone}
                disabled={isSaving}
                onChange={(event) => onToggle(agreement.id, event.target.checked)}
                className="accent-primary mt-1 size-4 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className={cn(isDone && 'text-text-muted line-through')}>
                  {agreement.description}
                </p>
                <Meta agreement={agreement} />
                {agreement.isOverdue ? (
                  <div className="mt-1">
                    <StatusBadge tone="attention">Atrasado</StatusBadge>
                  </div>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSaving}
                onClick={() => onCancel(agreement.id)}
              >
                Cancelar combinado
              </Button>
            </li>
          );
        })}
      </ul>

      {errorMessage ? (
        <p role="alert" className="text-danger mt-2 text-body-sm">
          {errorMessage}
        </p>
      ) : null}

      <div className="border-border border-t pt-3">
        {isAdding ? (
          <NoteAgreementForm
            isSaving={isSaving}
            onCancel={() => setIsAdding(false)}
            onSubmit={(input) => onAdd(input, () => setIsAdding(false))}
          />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
            Adicionar combinado
          </Button>
        )}
      </div>
    </section>
  );
}
