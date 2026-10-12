import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

const setup = () => {
  const onContinue = vi.fn();
  render(<LoginForm onContinue={onContinue} />);
  return { onContinue };
};

describe('LoginForm', () => {
  it('deve pedir o e-mail quando o campo está vazio', async () => {
    const { onContinue } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText('Informe seu e-mail de trabalho.')).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('deve recusar e-mail mal escrito', async () => {
    const { onContinue } = setup();

    await userEvent.type(screen.getByLabelText('E-mail de trabalho'), 'ana@empresa');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('deve continuar com o e-mail sem espaços nas pontas, inclusive com Enter', async () => {
    const { onContinue } = setup();

    await userEvent.type(
      screen.getByLabelText('E-mail de trabalho'),
      ' ana@empresa.com.br {Enter}',
    );

    expect(onContinue).toHaveBeenCalledWith('ana@empresa.com.br');
  });

  it('não deve pedir senha: ela é digitada na página do Keycloak', () => {
    setup();

    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeNull();
  });
});
