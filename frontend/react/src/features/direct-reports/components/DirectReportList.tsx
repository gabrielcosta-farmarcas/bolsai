import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCalendarDate } from '@/lib/format';
import type { DirectReport } from '../types';

type DirectReportListProps = {
  reports: DirectReport[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
  onRetry: () => void;
};

export function DirectReportList({
  reports,
  isLoading,
  errorMessage,
  onRetry,
}: DirectReportListProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando pessoas…
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

  if (!reports || reports.length === 0) {
    return (
      <p className="text-text-muted">
        Nenhuma pessoa por aqui ainda. Cadastre a primeira para começar.
      </p>
    );
  }

  return (
    <ul className="bg-surface border-border divide-border divide-y overflow-hidden rounded-lg border">
      {reports.map((report) => (
        <li key={report.id}>
          <Link
            to={`/pessoas/${report.id}`}
            className="text-text hover:bg-primary-subtle grid grid-cols-[2.5rem_1fr] items-center gap-x-6 gap-y-2 px-5 py-4 focus-visible:shadow-[inset_var(--focus-ring)] md:grid-cols-[2.5rem_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"
          >
            <Avatar name={report.name} />
            <span className="min-w-0">
              <span className="text-body block font-semibold">{report.name}</span>
              <span className="text-text-muted text-body-sm block">{report.role}</span>
              {report.status === 'inactive' ? (
                <span className="mt-1 inline-block">
                  <StatusBadge>Inativa</StatusBadge>
                </span>
              ) : null}
            </span>
            <span className="col-start-2 md:col-start-auto">
              <span className="text-caption block">Último encontro</span>
              <span className="text-body">
                {report.lastSessionOn ? formatCalendarDate(report.lastSessionOn) : 'Nenhum ainda'}
              </span>
            </span>
            <span className="col-start-2 md:col-start-auto">
              <span className="text-caption block">No time desde</span>
              <span className="text-body">{formatCalendarDate(report.startedAt)}</span>
            </span>
            <span className="col-start-2 md:col-start-auto md:justify-self-start">
              {report.openAgreements > 0 ? (
                <StatusBadge tone="agreement">
                  {report.openAgreements === 1
                    ? '1 combinado em aberto'
                    : `${report.openAgreements} combinados em aberto`}
                </StatusBadge>
              ) : (
                <span className="text-caption">Sem combinados em aberto</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
