import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type TooltipProps = {
  // O que aparece no balão (ex.: a frase completa).
  content: ReactNode;
  children: ReactNode;
  className?: string;
};

// Balão que aparece ao passar o mouse, ao focar pelo teclado (Tab) ou ao tocar. Esc fecha.
// Sem sombra, só borda, como o resto da interface (frontend/BRAND.md).
export function Tooltip({ content, children, className }: TooltipProps) {
  const id = useId();

  return (
    <span className={cn('group relative inline-block max-w-full', className)}>
      <span
        tabIndex={0}
        aria-describedby={id}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.currentTarget.blur();
        }}
        className="cursor-help rounded-sm underline decoration-dotted decoration-1 underline-offset-4"
      >
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className="bg-surface border-border text-text text-body-sm invisible absolute top-full left-0 z-10 mt-2 w-80 max-w-[85vw] rounded-lg border p-3 font-normal whitespace-pre-line opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
