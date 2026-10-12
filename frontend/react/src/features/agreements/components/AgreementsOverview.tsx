import { useState } from 'react';
import { SelectField } from '@/components/ui/SelectField';
import { useAgreementsOverview, useUpdateAgreement } from '../hooks/useAgreements';
import type { AgreementStatusFilter } from '../types';
import { AgreementList } from './AgreementList';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Em aberto' },
  { value: 'overdue', label: 'Atrasados' },
  { value: 'done', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'all', label: 'Todos' },
] as const;

type AgreementsOverviewProps = {
  people: ReadonlyArray<{ id: string; name: string }>;
};

// Visão geral: todos os combinados de todas as pessoas.
export function AgreementsOverview({ people }: AgreementsOverviewProps) {
  const [status, setStatus] = useState<AgreementStatusFilter>('open');
  const [directReportId, setDirectReportId] = useState('');
  const agreements = useAgreementsOverview(status, directReportId);
  const update = useUpdateAgreement();

  const personOptions = [
    { value: '', label: 'Todas' },
    ...people.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <section aria-label="Combinados">
      <div className="flex flex-wrap gap-4">
        <SelectField
          label="Situação"
          className="min-w-44"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(event) => setStatus(event.target.value as AgreementStatusFilter)}
        />
        <SelectField
          label="Pessoa"
          className="min-w-52"
          value={directReportId}
          options={personOptions}
          onChange={(event) => setDirectReportId(event.target.value)}
        />
      </div>
      <div className="mt-6">
        <AgreementList
          agreements={agreements.data?.data}
          isLoading={agreements.isLoading}
          errorMessage={agreements.error?.message}
          emptyMessage="Nenhum combinado por aqui. Ajuste os filtros ou registre um encontro."
          showPerson
          savingId={update.isPending ? update.variables?.id : undefined}
          saveErrorMessage={update.error?.message}
          onRetry={() => void agreements.refetch()}
          onChange={(id, patch) => update.mutate({ id, patch })}
        />
      </div>
    </section>
  );
}
