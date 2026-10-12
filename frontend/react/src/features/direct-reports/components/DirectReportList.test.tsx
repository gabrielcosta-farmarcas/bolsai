import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DirectReportList } from './DirectReportList';
import type { DirectReport } from '../types';

const report: DirectReport = {
  id: 'r1',
  name: 'Ana Souza',
  role: 'Analista',
  startedAt: '2025-03-10',
  status: 'inactive',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastSessionOn: '2026-10-01',
  openAgreements: 2,
};

const renderList = (props: Partial<Parameters<typeof DirectReportList>[0]> = {}) =>
  render(
    <MemoryRouter>
      <DirectReportList reports={[]} isLoading={false} onRetry={() => {}} {...props} />
    </MemoryRouter>,
  );

describe('DirectReportList', () => {
  it('deve mostrar o carregamento, o vazio e o erro', () => {
    const { unmount } = renderList({ isLoading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    unmount();

    const empty = renderList();
    expect(screen.getByText(/Nenhuma pessoa/)).toBeInTheDocument();
    empty.unmount();

    renderList({ errorMessage: 'Falhou' });
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
  });

  it('deve listar com link para o perfil e marcar inativo', () => {
    renderList({ reports: [report] });

    expect(screen.getByRole('link', { name: /Ana Souza/ })).toHaveAttribute('href', '/pessoas/r1');
    expect(screen.getByText('Inativa')).toBeInTheDocument();
    expect(screen.getByText(/10\/03\/2025/)).toBeInTheDocument();
  });
});
