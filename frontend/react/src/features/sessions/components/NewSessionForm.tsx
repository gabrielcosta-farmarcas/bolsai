import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/ui/TextAreaField';
import { TextField } from '@/components/ui/TextField';
import type { NewSessionInput } from '../types';

type NewSessionFormProps = {
  initialDate: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (input: NewSessionInput) => void;
  onCancel: () => void;
};

export function NewSessionForm({
  initialDate,
  isSubmitting,
  errorMessage,
  onSubmit,
  onCancel,
}: NewSessionFormProps) {
  const [heldOn, setHeldOn] = useState(initialDate);
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState('');
  const [fieldError, setFieldError] = useState<string>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (heldOn.length === 0) {
      setFieldError('Informe a data do 1:1.');
      return;
    }
    if (!file && transcript.trim().length === 0) {
      setFieldError('Cole a transcrição ou envie um arquivo.');
      return;
    }
    setFieldError(undefined);
    onSubmit(file ? { kind: 'file', heldOn, file } : { kind: 'text', heldOn, transcript });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-surface border-border rounded-lg border">
      <div className="grid gap-6 p-6 md:p-8">
        <div className="grid items-start gap-6 md:grid-cols-2">
          <TextField
            label="Data do encontro"
            type="date"
            value={heldOn}
            onChange={(event) => setHeldOn(event.target.value)}
          />
          <div>
            <label htmlFor="session-file" className="text-label mb-1 block">
              Enviar arquivo (.txt, .vtt, .srt ou .docx, até 10 MB)
            </label>
            <input
              id="session-file"
              type="file"
              accept=".txt,.vtt,.srt,.docx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-body-sm border-border-strong w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>
        <TextAreaField
          label="Ou cole a transcrição"
          rows={14}
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
        />
        {fieldError || errorMessage ? (
          <p role="alert" className="text-danger text-body-sm">
            {fieldError ?? errorMessage}
          </p>
        ) : null}
      </div>
      <div className="border-border flex justify-end gap-2 border-t px-6 py-4 md:px-8">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar e analisar'}
        </Button>
      </div>
    </form>
  );
}
