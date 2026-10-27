import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { NoteList } from '../types';
import { NotesPanel } from './NotesPanel';

const list: NoteList = {
  counts: { all: 2, no_plan: 1, in_progress: 0, resolved: 1 },
  data: [
    {
      id: 'n1',
      directReportId: 'r1',
      kind: 'agreement_missed',
      description: 'Relatório não entregue',
      notedAt: '2026-10-26',
      status: 'no_plan',
      bringToNextSession: false,
      resolvedAt: null,
      createdAt: '2026-10-26T12:00:00.000Z',
      steps: [],
      progress: { done: 0, total: 0 },
    },
    {
      id: 'n2',
      directReportId: 'r1',
      kind: 'praise',
      description: 'Conduziu bem a reunião',
      notedAt: '2026-10-20',
      status: 'resolved',
      bringToNextSession: false,
      resolvedAt: '2026-10-21T12:00:00.000Z',
      createdAt: '2026-10-20T12:00:00.000Z',
      steps: [],
      progress: { done: 0, total: 0 },
    },
  ],
};

const renderPanel = (response: NoteList) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <NotesPanel directReportId="r1" />
    </QueryClientProvider>,
  );
};

afterEach(() => vi.unstubAllGlobals());

describe('NotesPanel', () => {
  it('deve convidar a registrar o primeiro ponto quando não há anotações', async () => {
    renderPanel({ data: [], counts: { all: 0, no_plan: 0, in_progress: 0, resolved: 0 } });
    expect(await screen.findByText('Registre o primeiro ponto')).toBeInTheDocument();
  });

  it('deve listar com situação e filtrar por situação', async () => {
    renderPanel(list);

    expect(await screen.findByText('Relatório não entregue')).toBeInTheDocument();
    expect(screen.getByText('Conduziu bem a reunião')).toBeInTheDocument();
    expect(screen.getByText('Sem plano ainda')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Resolvidas 1/ }));
    expect(screen.queryByText('Relatório não entregue')).not.toBeInTheDocument();
    expect(screen.getByText('Conduziu bem a reunião')).toBeInTheDocument();
  });

  it('deve abrir o formulário de nova anotação', async () => {
    renderPanel(list);
    await userEvent.click(await screen.findByRole('button', { name: 'Nova anotação' }));
    expect(screen.getByLabelText('O que aconteceu')).toBeInTheDocument();
  });
});
