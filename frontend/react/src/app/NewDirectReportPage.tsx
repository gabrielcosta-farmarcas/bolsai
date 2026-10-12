import { useNavigate } from 'react-router-dom';
import { DirectReportForm, useCreateDirectReport } from '@/features/direct-reports';
import { emptyFields, useExtractProposal } from '@/features/responsibilities';

export function NewDirectReportPage() {
  const navigate = useNavigate();
  const create = useCreateDirectReport();
  const extract = useExtractProposal();

  return (
    <div className="mx-auto max-w-4xl">
      <h1>Nova pessoa</h1>
      <p className="text-text-muted mt-2">
        Cadastre a pessoa e as responsabilidades do cargo (no mínimo 3). Depois é só registrar o
        primeiro encontro.
      </p>
      <div className="mt-8">
        <DirectReportForm
          initialValues={{
            name: '',
            role: '',
            startedAt: '',
            status: 'active',
            mission: '',
            responsibilities: emptyFields(),
          }}
          submitLabel="Salvar"
          showResponsibilityMap
          onExtract={(file) => extract.mutateAsync(file)}
          isSubmitting={create.isPending}
          errorMessage={create.error?.message}
          onSubmit={(values) =>
            create.mutate(values, {
              onSuccess: (created) => void navigate(`/pessoas/${created.id}`),
            })
          }
          onCancel={() => void navigate('/pessoas')}
        />
      </div>
    </div>
  );
}
