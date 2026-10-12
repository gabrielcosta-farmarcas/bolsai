import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  useCreateAgreement,
  useReportAgreements,
  useUpdateAgreement,
} from '../hooks/useAgreements';
import { AgreementList } from './AgreementList';
import { NewAgreementForm } from './NewAgreementForm';

type ReportAgreementsProps = {
  directReportId: string;
};

// Combinados de uma pessoa: os que a IA salvou, os que você criou, com edição na própria lista.
export function ReportAgreements({ directReportId }: ReportAgreementsProps) {
  const agreements = useReportAgreements(directReportId);
  const update = useUpdateAgreement();
  const create = useCreateAgreement(directReportId);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <section aria-label="Combinados">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted max-w-reading">
          Os combinados que a IA encontra nos encontros ficam salvos aqui e valem para a próxima
          conversa.
        </p>
        {!isAdding ? <Button onClick={() => setIsAdding(true)}>Novo combinado</Button> : null}
      </div>

      <div className="mt-6">
        {isAdding ? (
          <NewAgreementForm
            isSaving={create.isPending}
            errorMessage={create.error?.message}
            onCancel={() => setIsAdding(false)}
            onSubmit={(input) => create.mutate(input, { onSuccess: () => setIsAdding(false) })}
          />
        ) : null}
        <AgreementList
          agreements={agreements.data}
          isLoading={agreements.isLoading}
          errorMessage={agreements.error?.message}
          emptyMessage="Ainda não há combinados. Eles aparecem aqui depois do primeiro encontro analisado."
          savingId={update.isPending ? update.variables?.id : undefined}
          saveErrorMessage={update.error?.message}
          onRetry={() => void agreements.refetch()}
          onChange={(id, patch) => update.mutate({ id, patch })}
        />
      </div>
    </section>
  );
}
