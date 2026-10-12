import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Settings } from '../types';
import { ApiKeySection } from './ApiKeySection';

const none: Settings['apiKey'] = {
  configured: false,
  source: 'none',
  last4: null,
  updatedAt: null,
};
const own: Settings['apiKey'] = {
  configured: true,
  source: 'leader',
  last4: '4f2a',
  updatedAt: '2026-10-12T15:00:00.000Z',
};

const renderSection = (apiKey: Settings['apiKey']) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <ApiKeySection apiKey={apiKey} />
    </QueryClientProvider>,
  );

const mockFetch = (status: number, body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }),
  );

describe('ApiKeySection', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('deve avisar que não há chave e só habilitar salvar com algo digitado', async () => {
    renderSection(none);

    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma chave cadastrada');
    expect(screen.getByRole('button', { name: 'Salvar chave' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Chave'), 'sk-ant-abc');
    expect(screen.getByRole('button', { name: 'Salvar chave' })).toBeEnabled();
  });

  it('deve mostrar só o final da chave cadastrada, e o campo nunca mostra a chave digitada', () => {
    renderSection(own);

    expect(screen.getByRole('status')).toHaveTextContent('•••• 4f2a');
    expect(screen.getByLabelText('Nova chave')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument();
  });

  it('deve mostrar o motivo quando a chave é recusada', async () => {
    mockFetch(422, {
      error: {
        code: 'API_KEY_REJECTED',
        message: 'Esta chave não foi aceita pela Anthropic.',
        details: [],
      },
    });
    renderSection(none);

    await userEvent.type(screen.getByLabelText('Chave'), 'sk-ant-chave-errada');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar chave' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('não foi aceita');
  });

  it('deve pedir confirmação antes de remover a chave', async () => {
    renderSection(own);

    await userEvent.click(screen.getByRole('button', { name: 'Remover' }));

    expect(await screen.findByText('Remover a chave?')).toBeInTheDocument();
  });
});
