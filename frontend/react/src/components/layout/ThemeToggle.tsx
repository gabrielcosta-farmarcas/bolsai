import { useState } from 'react';
import { currentTheme, setTheme, type Theme } from '@/lib/theme';

const LABEL: Record<Theme, string> = { light: 'claro', dark: 'escuro' };

// Alterna entre claro e escuro e lembra a escolha.
export function ThemeToggle() {
  const [theme, setCurrent] = useState<Theme>(currentTheme);

  const handleToggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setCurrent(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Alternar tema. Tema atual: ${LABEL[theme]}`}
      className="border-border-strong bg-surface text-text text-caption hover:bg-primary-subtle h-[var(--control-h-sm)] rounded-full border px-3 font-semibold"
    >
      Tema: {LABEL[theme]}
    </button>
  );
}
