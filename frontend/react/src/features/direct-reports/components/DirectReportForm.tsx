import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import {
  ResponsibilityFields,
  ResponsibilityFileImport,
  fieldsFrom,
  type Proposal,
} from '@/features/responsibilities';
import { useDirectReportForm } from '../hooks/useDirectReportForm';
import type { DirectReportInput } from '../types';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' },
] as const;

type DirectReportFormProps = {
  initialValues: DirectReportInput;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage?: string;
  // No cadastro: mostra a Missão e os campos de Responsabilidades (mínimo 3), que viram a versão 1 do responsograma.
  showResponsibilityMap?: boolean;
  // Lê um arquivo e devolve uma proposta para os campos (sem salvar). Sem isto, o botão não aparece.
  onExtract?: (file: File) => Promise<Proposal>;
  onSubmit: (values: DirectReportInput) => void;
  onCancel?: () => void;
};

export function DirectReportForm({
  initialValues,
  submitLabel,
  isSubmitting,
  errorMessage,
  showResponsibilityMap = false,
  onExtract,
  onSubmit,
  onCancel,
}: DirectReportFormProps) {
  const { values, errors, setField, handleSubmit } = useDirectReportForm(initialValues, onSubmit);

  const applyProposal = (proposal: Proposal) => {
    setField('responsibilities', fieldsFrom(proposal.responsibilities));
    if (proposal.mission) setField('mission', proposal.mission);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-surface border-border rounded-lg border">
      <div className="grid gap-x-6 gap-y-5 p-6 md:grid-cols-2 md:p-8">
        <TextField
          label="Nome"
          value={values.name}
          onChange={(event) => setField('name', event.target.value)}
          errorMessage={errors.name}
          autoComplete="off"
        />
        <TextField
          label="Cargo"
          value={values.role}
          onChange={(event) => setField('role', event.target.value)}
          errorMessage={errors.role}
          autoComplete="off"
        />
        <TextField
          label="No seu time desde"
          type="date"
          value={values.startedAt}
          onChange={(event) => setField('startedAt', event.target.value)}
          errorMessage={errors.startedAt}
        />
        <SelectField
          label="Situação"
          value={values.status}
          options={STATUS_OPTIONS}
          onChange={(event) =>
            setField('status', event.target.value as DirectReportInput['status'])
          }
        />
        {showResponsibilityMap && values.responsibilities ? (
          <fieldset className="border-border grid gap-5 border-t pt-6 md:col-span-2">
            <legend className="text-h3 pr-3">Responsograma</legend>
            <TextAreaField
              label="Missão / finalidade do cargo (opcional)"
              rows={3}
              value={values.mission ?? ''}
              onChange={(event) => setField('mission', event.target.value)}
            />
            {onExtract ? (
              <ResponsibilityFileImport onExtract={onExtract} onProposal={applyProposal} />
            ) : null}
            <ResponsibilityFields
              values={values.responsibilities}
              onChange={(next) => setField('responsibilities', next)}
              errorMessage={errors.responsibilities}
            />
          </fieldset>
        ) : null}
        {errorMessage ? (
          <p role="alert" className="text-danger text-body-sm md:col-span-2">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <div className="border-border flex justify-end gap-2 border-t px-6 py-4 md:px-8">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
