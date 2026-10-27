import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/cn';
import { formatCalendarDate, formatDateTime } from '@/lib/format';
import { buildRoteiroText } from '../lib/roteiroText';
import type { Preparation, PreparationContent } from '../types';

type PreparationPanelProps = {
  preparation: Preparation | null | undefined;
  isLoading: boolean;
  loadError?: string;
  isStarting: boolean;
  startError?: string;
  onStart: () => void;
};

type DetailId = 'agreements' | 'themes' | 'gaps';

const ownerLabel = (owner: 'leader' | 'report') => (owner === 'leader' ? 'Você' : 'A pessoa');

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// Etiqueta que abre ou fecha os detalhes embaixo.
function Chip({
  label,
  isOpen,
  onToggle,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={cn(
        'border-border text-caption rounded-full border px-3 py-1 font-semibold transition-colors',
        isOpen ? 'bg-primary-subtle text-primary' : 'bg-surface text-text hover:bg-primary-subtle',
      )}
    >
      {label}
    </button>
  );
}

function Details({ id, content }: { id: DetailId; content: PreparationContent }) {
  if (id === 'agreements') {
    return (
      <ul className="grid gap-4">
        {content.open_agreements.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {item.is_overdue ? <StatusBadge tone="attention">Atrasado</StatusBadge> : null}
            <span>{item.description}</span>
            <span className="text-text-muted text-body-sm">
              {ownerLabel(item.owner)} ·{' '}
              {item.due_date ? `prazo ${formatCalendarDate(item.due_date)}` : 'sem prazo'}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (id === 'themes') {
    return (
      <ul className="grid gap-4">
        {content.themes.map((theme) => (
          <li key={theme.title}>
            <span className="font-semibold">{theme.title}</span>
            {theme.detail ? <span className="text-text-muted"> · {theme.detail}</span> : null}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-4">
      {content.map_gaps.map((gap) => (
        <li key={gap.responsibility_id}>
          <span className="font-semibold">{gap.title}</span>
          <span className="text-text-muted">
            {gap.last_discussed_on
              ? ` · última conversa em ${formatCalendarDate(gap.last_discussed_on)}`
              : ' · nunca foi conversada'}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Roteiro({ content }: { content: PreparationContent }) {
  const [openId, setOpenId] = useState<DetailId | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const overdue = content.open_agreements.filter((item) => item.is_overdue).length;
  const agreementsLabel =
    plural(content.open_agreements.length, 'combinado em aberto', 'combinados em aberto') +
    (overdue > 0 ? ` (${overdue} ${overdue === 1 ? 'atrasado' : 'atrasados'})` : '');

  const chips: Array<{ id: DetailId; label: string }> = [
    ...(content.open_agreements.length > 0
      ? [{ id: 'agreements' as const, label: agreementsLabel }]
      : []),
    ...(content.themes.length > 0
      ? [
          {
            id: 'themes' as const,
            label: plural(content.themes.length, 'tema para retomar', 'temas para retomar'),
          },
        ]
      : []),
    ...(content.map_gaps.length > 0
      ? [
          {
            id: 'gaps' as const,
            label: plural(
              content.map_gaps.length,
              'responsabilidade pouco conversada',
              'responsabilidades pouco conversadas',
            ),
          },
        ]
      : []),
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildRoteiroText(content));
      setCopyFeedback('Roteiro copiado.');
    } catch {
      setCopyFeedback('Não deu para copiar o roteiro. Tente de novo.');
    }
  };

  return (
    <>
      {!content.has_history ? (
        <p role="status" className="bg-primary-subtle text-body-sm mt-6 rounded-lg p-3">
          Ainda não há encontros analisados desta pessoa. O roteiro se baseia só no responsograma.
        </p>
      ) : null}

      <section
        aria-label="Perguntas para o encontro"
        className="bg-primary-subtle mt-6 rounded-lg p-5"
      >
        <h2 className="text-h3">Perguntas para o encontro</h2>
        <ol className="mt-3 grid list-decimal gap-3 pl-5">
          {content.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>

      {chips.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              isOpen={openId === chip.id}
              onToggle={() => setOpenId(openId === chip.id ? null : chip.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-text-muted mt-5">Nenhum combinado em aberto nem tema pendente.</p>
      )}

      {openId ? (
        <div className="bg-surface border-border mt-3 rounded-lg border p-6">
          <Details id={openId} content={content} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => void copy()}>
          Copiar roteiro
        </Button>
        {copyFeedback ? (
          <span role="status" className="text-text-muted text-body-sm">
            {copyFeedback}
          </span>
        ) : null}
      </div>
    </>
  );
}

// Roteiro do próximo 1:1: gerado sob demanda a partir do histórico e do responsograma.
export function PreparationPanel({
  preparation,
  isLoading,
  loadError,
  isStarting,
  startError,
  onStart,
}: PreparationPanelProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando…
      </p>
    );
  }

  if (loadError) {
    return (
      <p role="alert" className="bg-danger-subtle border-danger text-danger rounded-lg border p-4">
        {loadError}
      </p>
    );
  }

  const isProcessing = preparation?.status === 'processing';
  const content = preparation?.status === 'completed' ? preparation.content : null;

  return (
    <section aria-label="Preparar o próximo 1:1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted">
          {content && preparation
            ? `Gerado em ${formatDateTime(preparation.createdAt)}`
            : 'Perguntas e contexto para o próximo encontro.'}
        </p>
        <Button onClick={onStart} disabled={isStarting || isProcessing}>
          {preparation ? 'Gerar de novo' : 'Gerar roteiro'}
        </Button>
      </div>

      {startError ? (
        <p role="alert" className="text-danger text-body-sm mt-4">
          {startError}
        </p>
      ) : null}

      {isProcessing ? (
        <p role="status" className="text-text-muted mt-6">
          Preparando o roteiro… isso pode levar alguns segundos.
        </p>
      ) : null}

      {preparation?.status === 'failed' ? (
        <p
          role="alert"
          className="bg-danger-subtle border-danger text-danger mt-6 rounded-lg border p-4"
        >
          {preparation.errorMessage ?? 'Não foi possível gerar o roteiro. Tente de novo.'}
        </p>
      ) : null}

      {!preparation ? (
        <p className="text-text-muted mt-6">Ainda não há roteiro. Clique em “Gerar roteiro”.</p>
      ) : null}

      {content ? <Roteiro content={content} /> : null}
    </section>
  );
}
