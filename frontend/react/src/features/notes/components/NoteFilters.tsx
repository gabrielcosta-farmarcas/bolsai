import { cn } from '@/lib/cn';
import type { NoteFilter, NoteList } from '../types';

const FILTERS: Array<{ id: NoteFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'no_plan', label: 'Sem plano' },
  { id: 'in_progress', label: 'Em andamento' },
  { id: 'resolved', label: 'Resolvidas' },
];

type NoteFiltersProps = {
  selected: NoteFilter;
  counts: NoteList['counts'];
  onSelect: (filter: NoteFilter) => void;
};

export function NoteFilters({ selected, counts, onSelect }: NoteFiltersProps) {
  return (
    <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
      {FILTERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={selected === id}
          onClick={() => onSelect(id)}
          className={cn(
            'rounded-full border px-3 py-1 text-body-sm font-semibold transition-colors',
            selected === id
              ? 'border-primary bg-primary-subtle text-primary'
              : 'border-border text-text-muted hover:bg-primary-subtle',
          )}
        >
          {label} {counts[id]}
        </button>
      ))}
    </div>
  );
}
