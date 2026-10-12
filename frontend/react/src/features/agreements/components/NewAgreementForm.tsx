import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import type { AgreementOwner, NewAgreementInput } from '../types';

const OWNER_OPTIONS = [
  { value: 'leader', label: 'Você' },
  { value: 'report', label: 'A pessoa' },
] as const;

type NewAgreementFormProps = {
  isSaving: boolean;
  errorMessage?: string;
  onSubmit: (input: NewAgreementInput) => void;
  onCancel: () => void;
};

export function NewAgreementForm({
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: NewAgreementFormProps) {
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState<AgreementOwner>('report');
  const [dueDate, setDueDate] = useState('');
  const [fieldError, setFieldError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (description.trim().length === 0) {
      setFieldError('Descreva o combinado.');
      return;
    }
    setFieldError(undefined);
    onSubmit({ description: description.trim(), owner, dueDate: dueDate || null });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-surface border-border mb-6 grid gap-4 rounded-lg border p-5"
    >
      <TextAreaField
        label="Novo combinado"
        rows={2}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Responsável"
          value={owner}
          options={OWNER_OPTIONS}
          onChange={(event) => setOwner(event.target.value as AgreementOwner)}
        />
        <TextField
          label="Prazo (opcional)"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </div>
      {fieldError || errorMessage ? (
        <p role="alert" className="text-danger text-body-sm">
          {fieldError ?? errorMessage}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>
          Salvar combinado
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
