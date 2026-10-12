import { Button } from '@/components/ui/Button';
import type { Agreement, AgreementPatch } from '../types';
import { AgreementItem } from './AgreementItem';

type AgreementListProps = {
  agreements: Agreement[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  emptyMessage: string;
  showPerson?: boolean;
  savingId?: string;
  saveErrorMessage?: string;
  onRetry: () => void;
  onChange: (id: string, patch: AgreementPatch) => void;
};

export function AgreementList({
  agreements,
  isLoading,
  errorMessage,
  emptyMessage,
  showPerson,
  savingId,
  saveErrorMessage,
  onRetry,
  onChange,
}: AgreementListProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando combinados…
      </p>
    );
  }

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="bg-danger-subtle border-danger text-danger rounded-lg border p-4"
      >
        <p>{errorMessage}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!agreements || agreements.length === 0) {
    return <p className="text-text-muted">{emptyMessage}</p>;
  }

  return (
    <ul className="bg-surface border-border divide-border divide-y overflow-hidden rounded-lg border">
      {agreements.map((agreement) => (
        <AgreementItem
          key={`${agreement.id}-${agreement.description}-${agreement.status}-${agreement.dueDate}`}
          agreement={agreement}
          showPerson={showPerson}
          isSaving={savingId === agreement.id}
          errorMessage={savingId === agreement.id ? saveErrorMessage : undefined}
          onChange={(patch) => onChange(agreement.id, patch)}
        />
      ))}
    </ul>
  );
}
