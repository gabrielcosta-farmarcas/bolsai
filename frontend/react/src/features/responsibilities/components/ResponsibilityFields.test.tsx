import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { emptyFields } from '../lib/rules';
import { ResponsibilityFields } from './ResponsibilityFields';

function Harness({
  initial = emptyFields(),
  errorMessage,
}: {
  initial?: string[];
  errorMessage?: string;
}) {
  const [values, setValues] = useState(initial);
  return <ResponsibilityFields values={values} onChange={setValues} errorMessage={errorMessage} />;
}

describe('ResponsibilityFields', () => {
  it('deve mostrar 10 campos, um por responsabilidade, com rótulos numerados', () => {
    render(<Harness />);

    expect(screen.getAllByRole('textbox')).toHaveLength(10);
    expect(screen.getByLabelText('Responsabilidade 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Responsabilidade 10')).toBeInTheDocument();
  });

  it('deve contar as preenchidas e lembrar do mínimo de 3', async () => {
    render(<Harness />);
    expect(screen.getByRole('status')).toHaveTextContent('0 preenchidas · mínimo 3');

    await userEvent.type(screen.getByLabelText('Responsabilidade 1'), 'Atender os clientes');
    expect(screen.getByRole('status')).toHaveTextContent('1 preenchida · mínimo 3');

    await userEvent.type(screen.getByLabelText('Responsabilidade 4'), 'Registrar no CRM');
    expect(screen.getByRole('status')).toHaveTextContent('2 preenchidas · mínimo 3');
  });

  it('não deve contar campo só com espaços', async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText('Responsabilidade 2'), '    ');

    expect(screen.getByRole('status')).toHaveTextContent('0 preenchidas');
  });

  it('deve avisar sobre responsabilidades repetidas', async () => {
    render(
      <Harness
        initial={['Atender os clientes', 'ATENDER  os clientes', '', '', '', '', '', '', '', '']}
      />,
    );

    expect(screen.getByText(/1 responsabilidade repetida/)).toBeInTheDocument();
  });

  it('deve mostrar a mensagem de erro recebida', () => {
    render(<Harness errorMessage="Preencha pelo menos 3 responsabilidades. Faltam 3." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Faltam 3');
  });
});
