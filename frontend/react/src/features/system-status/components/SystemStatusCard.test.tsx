import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SystemStatusCard } from './SystemStatusCard';

describe('SystemStatusCard', () => {
  it('deve mostrar o carregamento', () => {
    render(<SystemStatusCard status={undefined} isLoading onRetry={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Verificando');
  });

  it('deve mostrar a conexão ok', () => {
    render(<SystemStatusCard status="ok" isLoading={false} onRetry={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('conectados');
  });

  it('deve mostrar o erro e permitir tentar de novo', async () => {
    const onRetry = vi.fn();
    render(<SystemStatusCard status="unavailable" isLoading={false} onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
