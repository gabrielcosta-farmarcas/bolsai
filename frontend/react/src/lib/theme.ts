// Tema: segue o sistema até a pessoa escolher; a escolha fica guardada neste navegador.
// Os tokens já reagem à classe .dark / .light no <html> (src/styles/tokens.css).
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bonsai-theme';

export const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export const storedTheme = (): Theme | null => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
};

export const currentTheme = (): Theme => {
  const root = document.documentElement;
  if (root.classList.contains('dark')) return 'dark';
  if (root.classList.contains('light')) return 'light';
  return systemTheme();
};

const paint = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
};

// Ao abrir o app: aplica a escolha guardada, se houver.
export const initTheme = () => {
  const stored = storedTheme();
  if (stored) paint(stored);
};

export const setTheme = (theme: Theme) => {
  paint(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sem armazenamento (janela privada): o tema vale só enquanto a página estiver aberta.
  }
};
