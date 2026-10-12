import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatLongDate } from '@/lib/format';
import type { Session, SessionStatus } from '../types';

const STATUS_LABEL: Record<SessionStatus, string> = {
  draft: 'Sem análise',
  analysed: 'Aguardando revisão',
  reviewed: 'Revisado',
};

type SessionListProps = {
  sessions: Session[] | undefined;
  isLoading: boolean;
  errorMessage?: string;
};

export function SessionList({ sessions, isLoading, errorMessage }: SessionListProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Carregando encontros…
      </p>
    );
  }
  if (errorMessage) {
    return (
      <p role="alert" className="text-danger">
        {errorMessage}
      </p>
    );
  }
  if (!sessions || sessions.length === 0) {
    return <p className="text-text-muted">Nenhum encontro registrado ainda.</p>;
  }

  return (
    <ul className="divide-border border-border divide-y border-y">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            to={`/encontros/${session.id}`}
            className="text-text hover:bg-primary-subtle flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-4"
          >
            <span className="text-body-lg font-semibold first-letter:capitalize">
              {formatLongDate(session.heldOn)}
            </span>
            <StatusBadge tone={session.status === 'reviewed' ? 'growth' : 'neutral'}>
              {STATUS_LABEL[session.status]}
            </StatusBadge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
