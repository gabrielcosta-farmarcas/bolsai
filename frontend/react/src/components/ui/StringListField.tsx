import { useId, useLayoutEffect, useRef } from 'react';
import { Button } from './Button';
import { fieldControlClass } from './TextField';
import { cn } from '@/lib/cn';

export type StringListFieldProps = {
  label: string;
  items: string[];
  addLabel: string;
  emptyMessage: string;
  onChange: (items: string[]) => void;
};

// Campo de texto que cresce com o conteúdo (o texto nunca fica cortado) e se ajusta ao mudar a largura da janela.
function GrowingInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = () => {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useLayoutEffect(fit, [value]);
  useLayoutEffect(() => {
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      // Cada item é um texto só: Enter não cria linha nova.
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.preventDefault();
      }}
      className={cn(
        fieldControlClass,
        'min-h-[var(--control-h)] resize-none overflow-hidden py-2 leading-relaxed',
      )}
    />
  );
}

// Lista de textos editáveis (adicionar, editar, remover). Cada texto aparece inteiro, em quantas linhas precisar.
export function StringListField({
  label,
  items,
  addLabel,
  emptyMessage,
  onChange,
}: StringListFieldProps) {
  const groupId = useId();

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-label">{label}</legend>
      {items.length === 0 ? <p className="text-text-muted text-body-sm">{emptyMessage}</p> : null}
      {items.map((item, index) => (
        <div key={`${groupId}-${index}`} className="flex items-start gap-2">
          <GrowingInput
            ariaLabel={`${label} ${index + 1}`}
            value={item}
            onChange={(next) => onChange(items.map((current, i) => (i === index ? next : current)))}
          />
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Remover ${label} ${index + 1}`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remover
          </Button>
        </div>
      ))}
      <div>
        <Button variant="secondary" size="sm" onClick={() => onChange([...items, ''])}>
          {addLabel}
        </Button>
      </div>
    </fieldset>
  );
}
