import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCalendarDate, formatDateTime } from '@/lib/format';
import type { Preparation, PreparationContent } from '../types';

type PreparationPanelProps = {
  preparation: Preparation | null | undefined;
  isLoading: boolean;
  loadError?: string;
  isStarting: boolean;
  startError?: string;
  onStart: () => void;
};

const ownerLabel = (owner: 'leader' | 'report') => (owner === 'leader' ? 'Você' : 'A pessoa');

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8" aria-label={title}>
      <h2 className="text-h3">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Roteiro({ content }: { content: PreparationContent }) {
  return (
    <>
      {!content.has_history ? (
        <p role="status" className="bg-primary-subtle text-body-sm mt-6 rounded-lg p-3">
          Ainda não há encontros analisados desta pessoa. O roteiro se baseia só no responsograma.
        </p>
      ) : null}

      <Section title="Perguntas para o encontro">
        <ol className="grid max-w-reading list-decimal gap-2 pl-5">
          {content.questions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </Section>

      <Section title="Combinados em aberto">
        {content.open_agreements.length === 0 ? (
          <p className="text-text-muted">Nenhum combinado em aberto.</p>
        ) : (
          <ul className="bg-surface border-border divide-border divide-y overflow-hidden rounded-lg border">
            {content.open_agreements.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4">
                <span className="max-w-reading">{item.description}</span>
                <span className="text-text-muted text-body-sm">
                  {ownerLabel(item.owner)}
                  {item.due_date ? ` · prazo ${formatCalendarDate(item.due_date)}` : ' · sem prazo'}
                </span>
                {item.is_overdue ? <StatusBadge tone="attention">Atrasado</StatusBadge> : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {content.themes.length > 0 ? (
        <Section title="Temas para retomar">
          <ul className="grid max-w-reading gap-3">
            {content.themes.map((theme) => (
              <li key={theme.title}>
                <span className="font-semibold">{theme.title}</span>
                {theme.detail ? <span className="text-text-muted"> · {theme.detail}</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {content.map_gaps.length > 0 ? (
        <Section title="Responsabilidades pouco conversadas">
          <ul className="grid max-w-reading gap-2">
            {content.map_gaps.map((gap) => (
              <li key={gap.responsibility_id}>
                <span className="font-semibold">{gap.title}</span>
                <span className="text-text-muted">
                  {gap.last_discussed_on
                    ? ` · última conversa em ${formatCalendarDate(gap.last_discussed_on)}`
                    : ' · ainda não foi conversada'}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
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
  const hasRoteiro = preparation?.status === 'completed' && preparation.content !== null;

  return (
    <section aria-label="Preparar o próximo 1:1">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted max-w-reading">
          O Bonsai junta os combinados em aberto, os temas dos últimos encontros e o responsograma
          para sugerir perguntas ao próximo 1:1.
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

      {hasRoteiro && preparation.content ? (
        <>
          <p className="text-text-muted text-caption mt-6">
            Gerado em {formatDateTime(preparation.createdAt)}
          </p>
          <Roteiro content={preparation.content} />
        </>
      ) : null}
    </section>
  );
}
