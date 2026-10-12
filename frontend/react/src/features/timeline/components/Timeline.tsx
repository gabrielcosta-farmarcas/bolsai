import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { Timeline as TimelineData } from '../types';
import { EvolutionLegend } from './EvolutionLegend';
import { ResponsibilityEvolution } from './ResponsibilityEvolution';
import { TimelineEntryCard } from './TimelineEntryCard';

type TimelineProps = {
  timeline: TimelineData | undefined;
  isLoading: boolean;
  errorMessage?: string;
  onRetry: () => void;
};

const RAIL_PILL_WIDTHS = ['w-10', 'w-14', 'w-14'] as const;

// Resumo em frase calma, sem tom de cobrança.
const summarize = (totals: TimelineData['totals'], encounters: number) => {
  const encounterText = encounters === 1 ? '1 encontro' : `${encounters} encontros`;
  if (totals.agreements === 0) return `${encounterText} até aqui, ainda sem combinados.`;
  const parts = [
    `${totals.done} ${totals.done === 1 ? 'cumprido' : 'cumpridos'}`,
    `${totals.open} em aberto`,
  ];
  if (totals.overdue > 0) {
    parts.push(`${totals.overdue} ${totals.overdue === 1 ? 'atrasado' : 'atrasados'}`);
  }
  return `${encounterText} e ${totals.agreements} ${totals.agreements === 1 ? 'combinado' : 'combinados'}: ${parts.join(', ')}.`;
};

// Cada encontro acrescenta uma camada: o mais recente fica no topo e a pilha termina no tronco.
export function Timeline({ timeline, isLoading, errorMessage, onRetry }: TimelineProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando a linha do tempo…
      </p>
    );
  }

  if (errorMessage) {
    return (
      <div
        role="alert"
        className="bg-danger-subtle border-danger text-danger rounded-lg border p-4"
      >
        <p>{errorMessage}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (!timeline || timeline.entries.length === 0) {
    return (
      <p className="text-text-muted">
        A linha do tempo começa no primeiro encontro. Registre um encontro para ver a evolução
        crescer.
      </p>
    );
  }

  const entries = [...timeline.entries].reverse();

  return (
    <div className="grid gap-10">
      <p className="text-body-lg">{summarize(timeline.totals, timeline.entries.length)}</p>

      <div className="grid gap-10 xl:grid-cols-[24rem_minmax(0,1fr)] xl:items-start xl:gap-12">
        <section aria-labelledby="evolucao" className="xl:sticky xl:top-6">
          <h2 id="evolucao" className="mb-4">
            Evolução por responsabilidade
          </h2>
          <ResponsibilityEvolution responsibilities={timeline.responsibilities} />
          <EvolutionLegend />
        </section>

        <section aria-labelledby="encontros-linha">
          <h2 id="encontros-linha" className="mb-6">
            Encontros
          </h2>
          <ol className="grid">
            {entries.map((entry, index) => (
              <li key={entry.sessionId} className="grid grid-cols-[4.5rem_1fr] gap-x-4">
                <div aria-hidden="true" className="relative flex justify-center">
                  <span
                    className={cn(
                      'bg-border absolute w-px',
                      index === 0 ? 'top-8' : 'top-0',
                      index === entries.length - 1 ? 'h-8' : 'bottom-0',
                    )}
                  />
                  <span
                    className={cn(
                      'relative mt-6 block h-3.5 rounded-full',
                      RAIL_PILL_WIDTHS[(entries.length - 1 - index) % RAIL_PILL_WIDTHS.length],
                      entry.isReviewed ? 'bg-primary' : 'bg-liquen border-border-strong border',
                    )}
                  />
                </div>
                <div className="pb-5">
                  <TimelineEntryCard entry={entry} />
                </div>
              </li>
            ))}
            <li aria-hidden="true" className="grid grid-cols-[4.5rem_1fr] gap-x-4">
              <div className="flex justify-center">
                <span className="bg-primary block h-5 w-2 rounded-sm" />
              </div>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
