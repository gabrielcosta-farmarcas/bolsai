import { formatCalendarDate } from '@/lib/format';
import { useNotesForNextSession } from '../hooks/useNotes';
import { KIND_LABEL } from '../types';

type NextSessionNotesProps = { directReportId: string };

// Lembrete na aba Preparar 1:1: anotações que você marcou para levar ao próximo encontro.
export function NextSessionNotes({ directReportId }: NextSessionNotesProps) {
  const notes = useNotesForNextSession(directReportId);
  if (!notes.data || notes.data.length === 0) return null;

  return (
    <section
      aria-label="Anotações levadas ao encontro"
      className="bg-surface border-border mb-6 rounded-lg border p-5"
    >
      <h3>Anotações para este encontro</h3>
      <ul className="mt-3 grid gap-4">
        {notes.data.map((note) => {
          const open = note.steps.filter((step) => !step.done);
          return (
            <li key={note.id}>
              <p className="text-text-muted text-caption">
                {KIND_LABEL[note.kind]} · {formatCalendarDate(note.notedAt)}
              </p>
              <p className="whitespace-pre-line">{note.description}</p>
              {open.length > 0 ? (
                <ul className="text-text-muted mt-1 list-disc pl-5 text-body-sm">
                  {open.map((step) => (
                    <li key={step.id}>{step.text}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
