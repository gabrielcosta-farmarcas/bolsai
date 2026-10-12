import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { StringListField } from './StringListField';

function Harness({ initial }: { initial: string[] }) {
  const [items, setItems] = useState(initial);
  return (
    <StringListField
      label="Pergunta"
      items={items}
      addLabel="Adicionar pergunta"
      emptyMessage="Nenhuma pergunta."
      onChange={setItems}
    />
  );
}

describe('StringListField', () => {
  it('deve mostrar o texto inteiro em um campo que cresce (não é uma linha só)', () => {
    const long =
      'Quais bloqueios você enxerga hoje no seu trabalho e como está sua motivação com as suas responsabilidades?';
    render(<Harness initial={[long]} />);

    const field = screen.getByLabelText('Pergunta 1');
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveValue(long);
  });

  it('deve editar, adicionar e remover itens', async () => {
    render(<Harness initial={['Primeira']} />);

    await userEvent.type(screen.getByLabelText('Pergunta 1'), ' editada');
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar pergunta' }));
    await userEvent.type(screen.getByLabelText('Pergunta 2'), 'Segunda');

    expect(screen.getByLabelText('Pergunta 1')).toHaveValue('Primeira editada');
    expect(screen.getByLabelText('Pergunta 2')).toHaveValue('Segunda');

    await userEvent.click(screen.getByRole('button', { name: 'Remover Pergunta 1' }));
    expect(screen.getByLabelText('Pergunta 1')).toHaveValue('Segunda');
  });

  it('não deve criar linha nova ao apertar Enter', async () => {
    render(<Harness initial={['Texto']} />);

    await userEvent.type(screen.getByLabelText('Pergunta 1'), '{Enter}mais');

    expect(screen.getByLabelText('Pergunta 1')).toHaveValue('Textomais');
  });

  it('deve mostrar a mensagem quando a lista está vazia', () => {
    render(<Harness initial={[]} />);

    expect(screen.getByText('Nenhuma pergunta.')).toBeInTheDocument();
  });
});
