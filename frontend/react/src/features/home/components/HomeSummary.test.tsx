import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomeSummary } from './HomeSummary';

const renderSummary = (props: Partial<Parameters<typeof HomeSummary>[0]> = {}) =>
  render(
    <MemoryRouter>
      <HomeSummary
        isLoading={false}
        hasError={false}
        people={3}
        openAgreements={5}
        overdueAgreements={1}
        {...props}
      />
    </MemoryRouter>,
  );

describe('HomeSummary', () => {
  it('deve mostrar pessoas e combinados, com atrasados e links', () => {
    renderSummary();

    expect(screen.getByText('pessoas ativas no seu time')).toBeInTheDocument();
    expect(screen.getByText('em aberto, 1 atrasado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver combinados' })).toHaveAttribute(
      'href',
      '/combinados',
    );
  });

  it('deve dizer quando nada está atrasado e mostrar carregamento e erro', () => {
    const { unmount } = renderSummary({ overdueAgreements: 0 });
    expect(screen.getByText('em aberto, nenhum atrasado')).toBeInTheDocument();
    unmount();

    const loading = renderSummary({ isLoading: true });
    expect(screen.getByRole('status')).toBeInTheDocument();
    loading.unmount();

    renderSummary({ hasError: true });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
