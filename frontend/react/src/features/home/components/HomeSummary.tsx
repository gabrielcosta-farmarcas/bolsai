import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type SummaryCardProps = {
  title: string;
  value: string;
  detail: ReactNode;
  to: string;
  linkLabel: string;
};

function SummaryCard({ title, value, detail, to, linkLabel }: SummaryCardProps) {
  return (
    <section className="bg-surface border-border grid content-start gap-2 rounded-lg border p-6">
      <h2 className="text-h3">{title}</h2>
      <p className="text-h1">{value}</p>
      <p className="text-text-muted">{detail}</p>
      <Link to={to} className="text-primary text-label mt-2 underline underline-offset-4">
        {linkLabel}
      </Link>
    </section>
  );
}

type HomeSummaryProps = {
  isLoading: boolean;
  hasError: boolean;
  people: number;
  openAgreements: number;
  overdueAgreements: number;
};

export function HomeSummary({
  isLoading,
  hasError,
  people,
  openAgreements,
  overdueAgreements,
}: HomeSummaryProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando…
      </p>
    );
  }
  if (hasError) {
    return (
      <p role="alert" className="text-danger">
        Não foi possível carregar o resumo agora.
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <SummaryCard
        title="Pessoas"
        value={String(people)}
        detail={people === 1 ? 'pessoa ativa no seu time' : 'pessoas ativas no seu time'}
        to="/pessoas"
        linkLabel="Ver pessoas"
      />
      <SummaryCard
        title="Combinados"
        value={String(openAgreements)}
        detail={
          overdueAgreements > 0
            ? `em aberto, ${overdueAgreements} ${overdueAgreements === 1 ? 'atrasado' : 'atrasados'}`
            : 'em aberto, nenhum atrasado'
        }
        to="/combinados"
        linkLabel="Ver combinados"
      />
    </div>
  );
}
