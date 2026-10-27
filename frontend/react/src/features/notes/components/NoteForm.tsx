import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/SelectField';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import { KIND_LABEL, type NoteInput, type NoteKind } from '../types';

const MAX_DESCRIPTION = 2000;

const KIND_OPTIONS = (Object.keys(KIND_LABEL) as NoteKind[]).map((value) => ({
  value,
  label: KIND_LABEL[value],
}));

const todayLocal = () => new Date().toLocaleDateString('en-CA');

type NoteFormProps = {
  title: string;
  submitLabel: string;
  initialValues?: NoteInput;
  isSaving: boolean;
  errorMessage?: string;
  onSubmit: (input: NoteInput) => void;
  onCancel: () => void;
};

export function NoteForm({
  title,
  submitLabel,
  initialValues,
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [kind, setKind] = useState<NoteKind>(initialValues?.kind ?? 'attention');
  const [notedAt, setNotedAt] = useState(initialValues?.notedAt ?? todayLocal());
  const [fieldError, setFieldError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = description.trim();
    if (text.length === 0) {
      setFieldError('Conte o que aconteceu.');
      return;
    }
    if (text.length > MAX_DESCRIPTION) {
      setFieldError(`A anotação passou ${text.length - MAX_DESCRIPTION} caracteres do limite.`);
      return;
    }
    setFieldError(undefined);
    onSubmit({ kind, description: text, notedAt: notedAt || todayLocal() });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-surface border-border grid gap-4 rounded-lg border p-5"
    >
      <h3>{title}</h3>
      <TextAreaField
        label="O que aconteceu"
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Tipo"
          value={kind}
          options={KIND_OPTIONS}
          onChange={(event) => setKind(event.target.value as NoteKind)}
        />
        <TextField
          label="Data"
          type="date"
          value={notedAt}
          onChange={(event) => setNotedAt(event.target.value)}
        />
      </div>
      {fieldError || errorMessage ? (
        <p role="alert" className="text-danger text-body-sm">
          {fieldError ?? errorMessage}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
