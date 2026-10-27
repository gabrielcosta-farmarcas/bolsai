import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCreateNote, useNotes } from '../hooks/useNotes';
import type { NoteFilter } from '../types';
import { NoteFilters } from './NoteFilters';
import { NoteForm } from './NoteForm';
import { NoteItem } from './NoteItem';

type NotesPanelProps = { directReportId: string };

// Aba "Anotações" da pessoa: o que aconteceu, o plano de ação e a situação de cada ponto.
export function NotesPanel({ directReportId }: NotesPanelProps) {
  const notes = useNotes(directReportId);
  const create = useCreateNote(directReportId);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<NoteFilter>('all');

  const visible = (notes.data?.data ?? []).filter(
    (note) => filter === 'all' || note.status === filter,
  );

  return (
    <section aria-label="Anotações">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted max-w-reading">
          Só você vê estas anotações. Registre o que aconteceu e pense no que fazer a respeito.
        </p>
        {!isAdding ? <Button onClick={() => setIsAdding(true)}>Nova anotação</Button> : null}
      </div>

      <div className="mt-6 grid gap-4">
        {isAdding ? (
          <NoteForm
            title="Nova anotação"
            submitLabel="Salvar anotação"
            isSaving={create.isPending}
            errorMessage={create.error?.message}
            onCancel={() => setIsAdding(false)}
            onSubmit={(input) => create.mutate(input, { onSuccess: () => setIsAdding(false) })}
          />
        ) : null}

        {notes.isLoading ? (
          <p role="status" className="text-text-muted">
            Carregando…
          </p>
        ) : null}

        {notes.error ? (
          <div role="alert" className="text-danger">
            <p>{notes.error.message}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => void notes.refetch()}
            >
              Tentar de novo
            </Button>
          </div>
        ) : null}

        {notes.data && notes.data.counts.all === 0 && !isAdding ? (
          <div className="bg-surface border-border rounded-lg border p-6">
            <h3>Registre o primeiro ponto</h3>
            <p className="text-text-muted mt-1 max-w-reading">
              Algo ficou combinado e não aconteceu? Um elogio que vale lembrar? Anote aqui para
              pensar com calma no que fazer.
            </p>
          </div>
        ) : null}

        {notes.data && notes.data.counts.all > 0 ? (
          <>
            <NoteFilters selected={filter} counts={notes.data.counts} onSelect={setFilter} />
            {visible.length === 0 ? (
              <p className="text-text-muted">Nenhuma anotação nesta situação.</p>
            ) : (
              <ul className="grid gap-4">
                {visible.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
