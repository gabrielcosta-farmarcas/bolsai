import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('deve ligar o texto ao balão para leitores de tela e permitir foco pelo teclado', async () => {
    render(<Tooltip content="Frase completa da responsabilidade.">Título curto</Tooltip>);

    const trigger = screen.getByText('Título curto');
    const balloon = screen.getByRole('tooltip');

    expect(balloon).toHaveTextContent('Frase completa da responsabilidade.');
    expect(trigger).toHaveAttribute('aria-describedby', balloon.id);
    expect(trigger).toHaveAttribute('tabindex', '0');
    await userEvent.tab();
    expect(trigger).toHaveFocus();
  });

  it('deve tirar o foco com Esc', async () => {
    render(<Tooltip content="Texto">Título</Tooltip>);
    await userEvent.tab();
    expect(screen.getByText('Título')).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    expect(screen.getByText('Título')).not.toHaveFocus();
  });
});
