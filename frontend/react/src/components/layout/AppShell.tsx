import type { ReactNode } from 'react';
import { NavLink, useMatch } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/features/auth';
import { cn } from '@/lib/cn';

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { to: '/', label: 'Início' },
  { to: '/pessoas', label: 'Pessoas' },
  { to: '/combinados', label: 'Combinados' },
] as const;

export function AppShell({ children }: AppShellProps) {
  // A tela do encontro é um espaço de trabalho: ocupa a altura toda e cada área rola sozinha (tela larga).
  const { signOut } = useAuth();
  const isWorkspace = useMatch('/encontros/:id') !== null;

  return (
    <div
      className={cn(
        'min-h-screen',
        isWorkspace && 'lg:flex lg:h-screen lg:flex-col lg:overflow-hidden',
      )}
    >
      <a
        href="#conteudo"
        className="bg-surface absolute -translate-y-full rounded-md px-3 py-2 text-body-sm focus:translate-y-2"
      >
        Ir para o conteúdo
      </a>
      <header className="bg-surface border-border border-b">
        <div className="flex min-h-[var(--topbar-h)] w-full flex-wrap items-center gap-x-10 gap-y-2 px-6 md:px-8">
          <NavLink to="/" aria-label="Bonsai, ir para o início" className="rounded-md">
            <Logo variant="horizontal" size="topbar" />
          </NavLink>
          <nav aria-label="Principal">
            <ul className="flex gap-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-md px-3 py-2 text-body',
                        isActive
                          ? 'bg-primary-subtle text-primary font-semibold'
                          : 'text-text-muted hover:bg-primary-subtle',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/configuracoes"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-label font-semibold',
                  isActive ? 'bg-primary-subtle text-primary' : 'text-text hover:bg-primary-subtle',
                )
              }
            >
              Configurações
            </NavLink>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main
        id="conteudo"
        className={cn(isWorkspace ? 'lg:min-h-0 lg:flex-1' : 'px-6 py-8 md:px-8 md:py-10')}
      >
        {children}
      </main>
    </div>
  );
}
