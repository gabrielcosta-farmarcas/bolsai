import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SummaryActions } from './SummaryActions';

const renderActions = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <SummaryActions sessionId="s1" />
    </QueryClientProvider>,
  );

const mockFetch = (response: { ok: boolean; status: number; body: unknown }) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
    }),
  );

describe('SummaryActions', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('deve copiar o texto do resumo e avisar', async () => {
    mockFetch({
      ok: true,
      status: 200,
      body: { markdown: '# Resumo', fileName: 'r.md', exportedAt: '2026-10-12T12:00:00.000Z' },
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    renderActions();

    await userEvent.click(screen.getByRole('button', { name: 'Copiar resumo' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Resumo copiado');
    expect(writeText).toHaveBeenCalledWith('# Resumo');
  });

  it('deve mostrar o motivo quando o servidor recusa', async () => {
    mockFetch({
      ok: false,
      status: 409,
      body: {
        error: { code: 'SESSION_NOT_REVIEWED', message: 'Salve a versão final.', details: [] },
      },
    });
    renderActions();

    await userEvent.click(screen.getByRole('button', { name: 'Copiar resumo' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Salve a versão final.');
  });
});
