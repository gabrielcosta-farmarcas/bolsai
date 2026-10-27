import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { OWNER_LABEL, type AgreementOwner, type NoteAgreementInput } from '../types';

const MAX_TEXT = 2000;

const OWNER_OPTIONS = (Object.keys(OWNER_LABEL) as AgreementOwner[]).map((value) => ({
  value,
  label: OWNER_LABEL[value],
}));

type NoteAgreementFormProps = {
  isSaving: boolean;
  errorMessage?: string;
  onSubmit: (input: NoteAgreementInput) => void;
  onCancel: () => void;
};

export function NoteAgreementForm({
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: NoteAgreementFormProps) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [owner, setOwner] = useState<AgreementOwner>('leader');
  const [fieldError, setFieldError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = description.trim();
    if (value.length === 0) {
      setFieldError('Descreva o combinado.');
      return;
    }
    if (value.length > MAX_TEXT) {
      setFieldError(`O combinado passou ${value.length - MAX_TEXT} caracteres do limite.`);
      return;
    }
    setFieldError(undefined);
    onSubmit({ description: value, dueDate: dueDate || null, owner });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-3 py-3">
      <TextField
        label="Combinado"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Prazo (opcional)"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <SelectField
          label="Responsável"
          value={owner}
          options={OWNER_OPTIONS}
          onChange={(event) => setOwner(event.target.value as AgreementOwner)}
        />
      </div>
      {fieldError || errorMessage ? (
        <p role="alert" className="text-danger text-body-sm">
          {fieldError ?? errorMessage}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isSaving}>
          Adicionar combinado
        </Button>
      </div>
    </form>
  );
}
