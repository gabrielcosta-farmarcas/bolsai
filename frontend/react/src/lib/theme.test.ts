import { currentTheme, initTheme, setTheme, storedTheme } from './theme';

const reset = () => {
  document.documentElement.classList.remove('dark', 'light');
  window.localStorage.clear();
};

beforeEach(reset);
afterAll(reset);

describe('tema', () => {
  it('deve aplicar e guardar a escolha', () => {
    setTheme('dark');

    expect(document.documentElement).toHaveClass('dark');
    expect(document.documentElement).not.toHaveClass('light');
    expect(storedTheme()).toBe('dark');
    expect(currentTheme()).toBe('dark');
  });

  it('deve reaplicar a escolha guardada ao abrir', () => {
    window.localStorage.setItem('bonsai-theme', 'dark');

    initTheme();

    expect(document.documentElement).toHaveClass('dark');
  });

  it('deve ignorar valor inválido guardado e não mexer no tema', () => {
    window.localStorage.setItem('bonsai-theme', 'roxo');

    initTheme();

    expect(storedTheme()).toBeNull();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('deve seguir o sistema quando não há escolha (claro quando não dá para saber)', () => {
    expect(currentTheme()).toBe('light');
  });
});
