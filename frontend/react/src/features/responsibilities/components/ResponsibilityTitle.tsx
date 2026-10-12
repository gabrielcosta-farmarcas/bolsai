import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import type { Responsibility } from '../types';

type ResponsibilityTitleProps = {
  responsibility: Pick<Responsibility, 'id' | 'title'>;
  isSaving?: boolean;
  errorMessage?: string;
  onSave: (title: string) => void;
};

const MAX_TITLE = 60;

// Título curto da responsabilidade, com edição no lugar: Enter salva, Esc cancela.
export function ResponsibilityTitle({
  responsibility,
  isSaving = false,
  errorMessage,
  onSave,
}: ResponsibilityTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(responsibility.title);

  const start = () => {
    setDraft(responsibility.title);
    setIsEditing(true);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (title.length === 0 || title === responsibility.title) {
      setIsEditing(false);
      return;
    }
    onSave(title);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-label">{responsibility.title}</span>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Editar o título "${responsibility.title}"`}
          onClick={start}
        >
          Editar título
        </Button>
        {errorMessage ? (
          <span role="alert" className="text-danger text-body-sm">
            {errorMessage}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`title-${responsibility.id}`}>
        Título da responsabilidade
      </label>
      <input
        id={`title-${responsibility.id}`}
        autoFocus
        value={draft}
        maxLength={MAX_TITLE}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsEditing(false);
        }}
        className="border-border-strong bg-surface text-text text-body h-[var(--control-h-sm)] w-72 max-w-full rounded-md border px-3"
      />
      <Button type="submit" size="sm" disabled={isSaving}>
        Salvar
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
        Cancelar
      </Button>
    </form>
  );
}
