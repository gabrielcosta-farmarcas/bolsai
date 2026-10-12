import { Button } from '@/components/ui/Button';
import type { SystemStatus } from '../hooks/useSystemStatus';

type SystemStatusCardProps = {
  status: SystemStatus | undefined;
  isLoading: boolean;
  onRetry: () => void;
};

export function SystemStatusCard({ status, isLoading, onRetry }: SystemStatusCardProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-text-muted">
        Verificando a conexão…
      </p>
    );
  }

  if (status !== 'ok') {
    return (
      <div
        role="alert"
        className="bg-danger-subtle border-danger text-danger rounded-lg border p-4"
      >
        <p>O servidor ou o banco de dados não respondeu.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <p role="status" className="text-success">
      Servidor e banco de dados conectados.
    </p>
  );
}
