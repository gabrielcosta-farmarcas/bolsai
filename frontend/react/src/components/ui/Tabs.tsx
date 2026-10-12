import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TabItem = {
  id: string;
  label: string;
  // Número mostrado ao lado do nome (ex.: quantidade de 1:1s).
  count?: number;
  content: ReactNode;
};

export type TabsProps = {
  label: string;
  items: readonly TabItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  // Ajustes de layout do pai (ex.: aba dentro de um painel com rolagem própria).
  className?: string;
  listClassName?: string;
  panelClassName?: string;
};

// Abas no padrão WAI-ARIA: setas (e Home/End) trocam de aba, só a aba ativa entra na ordem do Tab.
export function Tabs({
  label,
  items,
  selectedId,
  onSelect,
  className,
  listClassName,
  panelClassName,
}: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    const nextIndex =
      event.key === 'ArrowRight'
        ? (index + 1) % items.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + items.length) % items.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = items[nextIndex];
    if (!next) return;
    onSelect(next.id);
    tabRefs.current.get(next.id)?.focus();
  };

  if (!selected) return null;

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className={cn('border-border flex gap-1 overflow-x-auto border-b', listClassName)}
      >
        {items.map((item, index) => {
          const isSelected = item.id === selected.id;
          return (
            <button
              key={item.id}
              ref={(element) => {
                if (element) tabRefs.current.set(item.id, element);
                else tabRefs.current.delete(item.id);
              }}
              role="tab"
              type="button"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onSelect(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-body',
                '',
                isSelected
                  ? 'border-primary text-text font-semibold'
                  : 'text-text-muted hover:text-text border-transparent',
              )}
            >
              {item.label}
              {item.count !== undefined ? (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-caption leading-none',
                    isSelected ? 'bg-primary text-on-primary' : 'bg-liquen',
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${selected.id}`}
        aria-labelledby={`${baseId}-tab-${selected.id}`}
        tabIndex={0}
        className={cn('pt-8', panelClassName)}
      >
        {selected.content}
      </div>
    </div>
  );
}
