import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PreparationPanel } from './PreparationPanel';
import type { Preparation } from '../types';

const completed: Preparation = {
  id: 'p1',
  directReportId: 'r1',
  status: 'completed',
  errorMessage: null,
  model: 'm',
  createdAt: '2026-10-24T15:00:00.000Z',
  content: {
    has_history: true,
    questions: ['O que te motiva hoje?', 'Onde posso apoiar?', 'Como vê sua carreira?'],
    open_agreements: [
      {
        id: 'g1',
        description: 'Enviar a proposta',
        owner: 'report',
        due_date: '2026-10-15',
        is_overdue: true,
      },
    ],
    themes: [{ title: 'Proposta parada', detail: 'Voltou em dois encontros.' }],
    map_gaps: [
      { responsibility_id: 'q1', title: 'Relatórios', last_discussed_on: null },
      { responsibility_id: 'q2', title: 'Processos', last_discussed_on: '2026-09-01' },
    ],
  },
};

const renderPanel = (props: Partial<React.ComponentProps<typeof PreparationPanel>> = {}) => {
  const onStart = vi.fn();
  render(
    <PreparationPanel
      preparation={null}
      isLoading={false}
      isStarting={false}
      onStart={onStart}
      {...props}
    />,
  );
  return { onStart };
};

describe('PreparationPanel', () => {
  it('deve convidar a gerar o primeiro roteiro', async () => {
    const { onStart } = renderPanel();

    expect(screen.getByText(/Ainda não há roteiro/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Gerar roteiro' }));

    expect(onStart).toHaveBeenCalledOnce();
  });

  it('deve mostrar o andamento e travar o botão enquanto gera', () => {
    renderPanel({ preparation: { ...completed, status: 'processing', content: null } });

    expect(screen.getByRole('status')).toHaveTextContent('Preparando o roteiro');
    expect(screen.getByRole('button', { name: 'Gerar de novo' })).toBeDisabled();
  });

  it('deve mostrar o motivo da falha e deixar tentar de novo', () => {
    renderPanel({
      preparation: {
        ...completed,
        status: 'failed',
        content: null,
        errorMessage: 'Não foi possível obter a resposta da IA.',
      },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível obter a resposta da IA.');
    expect(screen.getByRole('button', { name: 'Gerar de novo' })).toBeEnabled();
  });

  it('deve mostrar perguntas, combinados, temas e responsabilidades pouco conversadas', () => {
    renderPanel({ preparation: completed });

    const questions = screen.getByRole('region', { name: 'Perguntas para o encontro' });
    expect(within(questions).getAllByRole('listitem')).toHaveLength(3);

    const agreements = screen.getByRole('region', { name: 'Combinados em aberto' });
    expect(within(agreements).getByText('Enviar a proposta')).toBeInTheDocument();
    expect(within(agreements).getByText('Atrasado')).toBeInTheDocument();

    expect(screen.getByText('Proposta parada')).toBeInTheDocument();

    const gaps = screen.getByRole('region', { name: 'Responsabilidades pouco conversadas' });
    expect(within(gaps).getByText(/ainda não foi conversada/)).toBeInTheDocument();
    expect(within(gaps).getByText(/última conversa em/)).toBeInTheDocument();
  });

  it('deve avisar que não há histórico e esconder seções vazias', () => {
    renderPanel({
      preparation: {
        ...completed,
        content: {
          ...completed.content!,
          has_history: false,
          open_agreements: [],
          themes: [],
          map_gaps: [],
        },
      },
    });

    expect(screen.getByText(/Ainda não há encontros analisados/)).toBeInTheDocument();
    expect(screen.getByText('Nenhum combinado em aberto.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Temas para retomar' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Responsabilidades pouco conversadas' }),
    ).not.toBeInTheDocument();
  });

  it('deve mostrar o erro ao pedir o roteiro', () => {
    renderPanel({ startError: 'A IA não está configurada.' });

    expect(screen.getByRole('alert')).toHaveTextContent('A IA não está configurada.');
  });
});
