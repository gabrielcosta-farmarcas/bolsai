import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { TextField } from '@/components/ui/TextField';
import { OWNER_LABEL, type StepInput, type StepOwner } from '../types';

const MAX_TEXT = 500;

const OWNER_OPTIONS = (Object.keys(OWNER_LABEL) as StepOwner[]).map((value) => ({
  value,
  label: OWNER_LABEL[value],
}));

type StepFormProps = {
  submitLabel: string;
  initialValues?: StepInput;
  isSaving: boolean;
  errorMessage?: string;
  onSubmit: (input: StepInput) => void;
  onCancel: () => void;
};

export function StepForm({
  submitLabel,
  initialValues,
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: StepFormProps) {
  const [text, setText] = useState(initialValues?.text ?? '');
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '');
  const [owner, setOwner] = useState<StepOwner>(initialValues?.owner ?? 'leader');
  const [fieldError, setFieldError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = text.trim();
    if (value.length === 0) {
      setFieldError('Descreva o passo.');
      return;
    }
    if (value.length > MAX_TEXT) {
      setFieldError(`O passo passou ${value.length - MAX_TEXT} caracteres do limite.`);
      return;
    }
    setFieldError(undefined);
    onSubmit({ text: value, dueDate: dueDate || null, owner });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-3 py-3">
      <TextField label="Passo" value={text} onChange={(event) => setText(event.target.value)} />
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
          onChange={(event) => setOwner(event.target.value as StepOwner)}
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
