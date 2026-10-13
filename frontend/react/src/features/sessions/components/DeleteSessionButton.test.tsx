import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DeleteSessionButton } from './DeleteSessionButton';

const Person = () => {
  const { state } = useLocation();
  return (
    <p>
      Página da pessoa {(state as { sessionDeleted?: boolean })?.sessionDeleted ? 'apagou' : ''}
    </p>
  );
};

const renderButton = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <MemoryRouter initialEntries={['/encontros/s1']}>
        <Routes>
          <Route
            path="/encontros/s1"
            element={<DeleteSessionButton sessionId="s1" directReportId="r1" />}
          />
          <Route path="/pessoas/r1" element={<Person />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('DeleteSessionButton', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('não deve apagar quando a pessoa cancela', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: 'Apagar encontro' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deve apagar e voltar para a pessoa quando confirma', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => null });
    vi.stubGlobal('fetch', fetchMock);
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: 'Apagar encontro' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByText(/Página da pessoa apagou/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/sessions/s1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('deve mostrar o erro quando o servidor recusa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { code: 'X', message: 'Deu ruim.', details: [] } }),
      }),
    );
    renderButton();

    await userEvent.click(screen.getByRole('button', { name: 'Apagar encontro' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Deu ruim.');
  });
});
