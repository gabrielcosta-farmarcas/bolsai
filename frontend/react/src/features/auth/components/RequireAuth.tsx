import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '../hooks/useAuth';

// Sem ter entrado, vai ao login e guarda de onde veio para voltar depois.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state, reload } = useAuth();
  const location = useLocation();

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading label="Verificando seu acesso…" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p role="alert" className="text-body-lg">
          Não conseguimos falar com o servidor agora.
        </p>
        <Button onClick={reload}>Tentar de novo</Button>
      </div>
    );
  }

  if (state.status === 'signedOut') {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return children;
}
