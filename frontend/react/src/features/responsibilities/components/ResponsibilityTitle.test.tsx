import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsibilityTitle } from './ResponsibilityTitle';

const responsibility = { id: 'q1', title: 'Pontos de atrito' };

describe('ResponsibilityTitle', () => {
  it('deve mostrar o título e abrir a edição', async () => {
    render(<ResponsibilityTitle responsibility={responsibility} onSave={vi.fn()} />);
    expect(screen.getByText('Pontos de atrito')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Editar o título/ }));

    expect(screen.getByLabelText('Título da responsabilidade')).toHaveValue('Pontos de atrito');
  });

  it('deve salvar o novo título com Enter, sem espaços sobrando', async () => {
    const onSave = vi.fn();
    render(<ResponsibilityTitle responsibility={responsibility} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /Editar o título/ }));
    const input = screen.getByLabelText('Título da responsabilidade');
    await userEvent.clear(input);
    await userEvent.type(input, '  Jornada do cliente {Enter}');

    expect(onSave).toHaveBeenCalledWith('Jornada do cliente');
    expect(screen.queryByLabelText('Título da responsabilidade')).not.toBeInTheDocument();
  });

  it('deve cancelar com Esc e com o botão, sem salvar', async () => {
    const onSave = vi.fn();
    render(<ResponsibilityTitle responsibility={responsibility} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /Editar o título/ }));
    await userEvent.type(screen.getByLabelText('Título da responsabilidade'), 'abc{Escape}');
    expect(screen.queryByLabelText('Título da responsabilidade')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Editar o título/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it('não deve salvar título vazio nem igual ao atual', async () => {
    const onSave = vi.fn();
    render(<ResponsibilityTitle responsibility={responsibility} onSave={onSave} />);

    await userEvent.click(screen.getByRole('button', { name: /Editar o título/ }));
    await userEvent.clear(screen.getByLabelText('Título da responsabilidade'));
    await userEvent.type(screen.getByLabelText('Título da responsabilidade'), '   {Enter}');
    await userEvent.click(screen.getByRole('button', { name: /Editar o título/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it('deve mostrar o erro de gravação', () => {
    render(
      <ResponsibilityTitle
        responsibility={responsibility}
        errorMessage="Não foi possível salvar."
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar.');
  });
});
