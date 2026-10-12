import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '../hooks/useAuth';

type RequireRoleProps = {
  role: string;
  children: ReactNode;
};

// Esconde a área para quem não tem o papel. A tela só avisa com educação: quem decide é sempre o servidor,
// que responde 403 mesmo se alguém contornar esta tela.
export function RequireRole({ role, children }: RequireRoleProps) {
  const { hasRole, signOut } = useAuth();

  if (hasRole(role)) return children;

  return (
    <main className="bg-bg flex min-h-screen items-center justify-center px-4 py-8">
      <div className="bg-surface border-border w-full max-w-[420px] rounded-xl border px-6 py-10 text-center md:px-10">
        <div className="flex justify-center">
          <Logo variant="vertical" size="login" />
        </div>
        <h1 className="text-h3 mt-6">Você não tem acesso a esta área</h1>
        <p className="text-text-muted mt-3">
          Sua conta ainda não tem permissão para usar esta parte do Bonsai. Fale com quem administra
          o acesso.
        </p>
        <Button variant="secondary" className="mt-6 w-full" onClick={() => void signOut()}>
          Sair
        </Button>
      </div>
    </main>
  );
}
