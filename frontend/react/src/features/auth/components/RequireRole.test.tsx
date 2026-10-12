import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { RequireRole } from './RequireRole';

const mockMe = (roles: string[]) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ user: { name: 'Ana', email: 'ana@empresa.com.br', roles } }),
    })),
  );
};

const renderArea = () =>
  render(
    <AuthProvider>
      <MemoryRouter>
        <RequireRole role="lider">
          <p>área da líder</p>
        </RequireRole>
      </MemoryRouter>
    </AuthProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('RequireRole', () => {
  it('deve mostrar a área para quem tem o papel', async () => {
    mockMe(['lider']);

    renderArea();

    expect(await screen.findByText('área da líder')).toBeInTheDocument();
  });

  it.each([[['administrador']], [['liderado']], [[]]])(
    'deve avisar e não mostrar a área para quem tem só %j',
    async (roles) => {
      mockMe(roles);

      renderArea();

      expect(await screen.findByText('Você não tem acesso a esta área')).toBeInTheDocument();
      expect(screen.queryByText('área da líder')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
    },
  );
});
