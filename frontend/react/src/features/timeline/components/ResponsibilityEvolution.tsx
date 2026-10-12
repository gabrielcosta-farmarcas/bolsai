import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import { formatCalendarDate } from '@/lib/format';
import type { Timeline } from '../types';
import { SIGNAL_FILL, SIGNAL_LABEL } from './signalStyle';

type ResponsibilityEvolutionProps = {
  responsibilities: Timeline['responsibilities'];
};

// Cada responsabilidade do responsograma vira uma fileira de pequenas camadas, uma por encontro.
export function ResponsibilityEvolution({ responsibilities }: ResponsibilityEvolutionProps) {
  if (responsibilities.length === 0) {
    return (
      <p className="text-text-muted">
        A evolução aparece aqui depois do primeiro encontro analisado.
      </p>
    );
  }

  return (
    // Sem overflow-hidden: o balão com a frase completa precisa poder passar da borda da lista.
    <ul className="bg-surface border-border divide-border divide-y rounded-lg border">
      {responsibilities.map((item) => (
        <li
          key={item.id ?? 'fora'}
          className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
        >
          <span className="text-label">
            {item.text ? (
              <Tooltip content={item.text}>{item.responsibility}</Tooltip>
            ) : (
              item.responsibility
            )}
          </span>
          <ol className="flex flex-wrap items-center gap-1.5">
            {item.points.map((point) => (
              <li key={`${point.sessionId}-${point.heldOn}`}>
                <span
                  className={cn('block h-3 w-8 rounded-full', SIGNAL_FILL[point.kind])}
                  title={`${formatCalendarDate(point.heldOn)}: ${SIGNAL_LABEL[point.kind]}`}
                />
                <span className="sr-only">
                  {formatCalendarDate(point.heldOn)}: {SIGNAL_LABEL[point.kind]}
                </span>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ul>
  );
}
