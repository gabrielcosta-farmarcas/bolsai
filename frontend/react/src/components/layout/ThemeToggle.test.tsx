import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

beforeEach(() => {
  document.documentElement.classList.remove('dark', 'light');
  window.localStorage.clear();
});

describe('ThemeToggle', () => {
  it('deve alternar entre claro e escuro, aplicando a classe e guardando a escolha', async () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /Tema atual: claro/ });
    expect(button).toHaveTextContent('Tema: claro');

    await userEvent.click(button);
    expect(button).toHaveTextContent('Tema: escuro');
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem('bonsai-theme')).toBe('dark');

    await userEvent.click(button);
    expect(button).toHaveTextContent('Tema: claro');
    expect(document.documentElement).toHaveClass('light');
  });
});
