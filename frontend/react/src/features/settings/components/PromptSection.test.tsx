import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Settings } from '../types';
import { PromptSection } from './PromptSection';

const prompt = (overrides: Partial<Settings['prompt']> = {}): Settings['prompt'] => ({
  text: 'Instruções padrão do Bonsai para a análise do encontro. '.repeat(6),
  isCustom: false,
  minChars: 200,
  maxChars: 30000,
  ...overrides,
});

const renderSection = (value: Settings['prompt']) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <PromptSection prompt={value} />
    </QueryClientProvider>,
  );

describe('PromptSection', () => {
  it('deve mostrar o texto atual como Padrão, sem salvar nem voltar ao padrão', () => {
    renderSection(prompt());

    expect(screen.getByText('Padrão')).toBeInTheDocument();
    expect(screen.getByLabelText('Texto do prompt')).toHaveValue(prompt().text);
    expect(screen.getByRole('button', { name: 'Salvar prompt' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Voltar ao padrão' })).not.toBeInTheDocument();
  });

  it('deve habilitar salvar ao editar e avisar quando o texto fica curto demais', async () => {
    renderSection(prompt());
    const field = screen.getByLabelText('Texto do prompt');

    await userEvent.type(field, ' Mais uma instrução.');
    expect(screen.getByRole('button', { name: 'Salvar prompt' })).toBeEnabled();

    await userEvent.clear(field);
    await userEvent.type(field, 'curto');
    expect(screen.getByRole('button', { name: 'Salvar prompt' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('entre 200 e 30.000');
  });

  it('deve oferecer voltar ao padrão só quando o prompt é personalizado, com confirmação', async () => {
    renderSection(prompt({ isCustom: true }));

    expect(screen.getByText('Personalizado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Voltar ao padrão' }));

    expect(await screen.findByText('Voltar ao prompt padrão?')).toBeInTheDocument();
  });
});
