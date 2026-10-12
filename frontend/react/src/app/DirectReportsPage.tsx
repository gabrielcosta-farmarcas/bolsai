import { useState } from 'react';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { SelectField } from '@/components/ui/SelectField';
import { DirectReportList, useDirectReports, type StatusFilter } from '@/features/direct-reports';

const FILTER_OPTIONS = [
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Inativas' },
  { value: 'all', label: 'Todas' },
] as const;

export function DirectReportsPage() {
  const [status, setStatus] = useState<StatusFilter>('active');
  const { data, isLoading, error, refetch } = useDirectReports(status);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Pessoas</h1>
          <p className="text-text-muted mt-1">
            Seu time e o histórico de encontros de cada pessoa.
          </p>
        </div>
        <ButtonLink to="/pessoas/nova">Nova pessoa</ButtonLink>
      </div>
      <SelectField
        label="Mostrar"
        className="mt-6 max-w-40"
        value={status}
        options={FILTER_OPTIONS}
        onChange={(event) => setStatus(event.target.value as StatusFilter)}
      />
      <div className="mt-6">
        <DirectReportList
          reports={data?.data}
          isLoading={isLoading}
          errorMessage={error ? error.message : undefined}
          onRetry={() => void refetch()}
        />
      </div>
    </>
  );
}
