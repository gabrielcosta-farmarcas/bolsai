import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { RequireAuth } from './RequireAuth';

function LoginProbe() {
  const state = useLocation().state as { from?: string } | null;
  return <p>login, veio de {state?.from}</p>;
}

const mockMe = (response: { status: number; body?: unknown } | Error) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      if (response instanceof Error) throw response;
      return {
        ok: response.status < 400,
        status: response.status,
        json: async () => response.body,
      };
    }),
  );
};

const renderAt = (path: string) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route
            path="/pessoas"
            element={
              <RequireAuth>
                <p>área interna</p>
              </RequireAuth>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

describe('RequireAuth', () => {
  it('deve levar ao login guardando a tela pedida quando ninguém entrou', async () => {
    mockMe({
      status: 401,
      body: { error: { code: 'UNAUTHENTICATED', message: 'Entre', details: [] } },
    });

    renderAt('/pessoas?aba=combinados');

    expect(await screen.findByText('login, veio de /pessoas?aba=combinados')).toBeInTheDocument();
    expect(screen.queryByText('área interna')).not.toBeInTheDocument();
  });

  it('deve mostrar a tela quando o servidor reconhece a sessão', async () => {
    mockMe({
      status: 200,
      body: { user: { name: 'Ana', email: 'ana@empresa.com.br', roles: ['lider'] } },
    });

    renderAt('/pessoas');

    expect(await screen.findByText('área interna')).toBeInTheDocument();
  });

  it('não deve mostrar a tela interna enquanto verifica o acesso', () => {
    mockMe({ status: 200, body: { user: { name: 'Ana', email: null, roles: [] } } });

    renderAt('/pessoas');

    expect(screen.getByRole('status')).toHaveTextContent('Verificando seu acesso…');
    expect(screen.queryByText('área interna')).not.toBeInTheDocument();
  });

  it('deve avisar, sem abrir a tela, quando o servidor não responde', async () => {
    mockMe(new Error('offline'));

    renderAt('/pessoas');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não conseguimos falar com o servidor',
    );
    expect(screen.queryByText('área interna')).not.toBeInTheDocument();
  });
});
