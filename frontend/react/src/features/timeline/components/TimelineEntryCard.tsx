import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { formatLongDate } from '@/lib/format';
import type { TimelineEntry } from '../types';
import { SIGNAL_FILL, SIGNAL_LABEL } from './signalStyle';

type TimelineEntryCardProps = {
  entry: TimelineEntry;
};

const AGREEMENT_BADGE = {
  done: { tone: 'growth', label: 'Concluído' },
  cancelled: { tone: 'neutral', label: 'Cancelado' },
  open: { tone: 'agreement', label: 'Em aberto' },
} as const;

export function TimelineEntryCard({ entry }: TimelineEntryCardProps) {
  const doneCount = entry.agreements.filter((item) => item.status === 'done').length;

  return (
    <article className="bg-surface border-border grid gap-4 rounded-lg border p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="first-letter:capitalize">{formatLongDate(entry.heldOn)}</h3>
        <div className="flex items-center gap-3">
          <StatusBadge tone={entry.isReviewed ? 'growth' : 'neutral'}>
            {entry.isReviewed ? 'Revisado' : 'Aguardando revisão'}
          </StatusBadge>
          <Link
            to={`/encontros/${entry.sessionId}`}
            className="text-label underline underline-offset-4"
          >
            Abrir encontro
          </Link>
        </div>
      </header>

      {entry.summary ? (
        <p className="text-body-lg">{entry.summary}</p>
      ) : (
        <p className="text-text-muted">Este encontro ainda não foi analisado.</p>
      )}

      {entry.signals.length > 0 ? (
        <section aria-label="Sinais de evolução">
          <ul className="grid gap-2">
            {entry.signals.map((signal, index) => (
              <li key={`${signal.responsibility}-${index}`} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn('mt-2 h-2 w-2 flex-none rounded-full', SIGNAL_FILL[signal.kind])}
                />
                <p className="text-body-sm">
                  <span className="text-label">{signal.responsibility}</span>
                  <span className="text-text-muted"> ({SIGNAL_LABEL[signal.kind]})</span>
                  {': '}
                  {signal.observation}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {entry.agreements.length > 0 ? (
        <section aria-label="Combinados deste encontro" className="grid gap-2">
          <p className="text-caption">
            {doneCount} de {entry.agreements.length}{' '}
            {entry.agreements.length === 1 ? 'combinado cumprido' : 'combinados cumpridos'}
          </p>
          <ul className="grid gap-2">
            {entry.agreements.map((agreement) => {
              const badge = AGREEMENT_BADGE[agreement.status];
              return (
                <li key={agreement.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                  {agreement.isOverdue ? (
                    <StatusBadge tone="attention">Atrasado</StatusBadge>
                  ) : null}
                  <span className="text-body-sm">{agreement.description}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
