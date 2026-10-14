import { useEffect, useId, useLayoutEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { fieldControlClass } from './TextField';

// Aceita os atributos nativos de <textarea> (value, onChange, rows, ...). O campo cresce com o texto
// (sem barra de rolagem interna); `rows` define a altura mínima.
export type TextAreaFieldProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'id'> & {
  label: string;
  errorMessage?: string;
};

export function TextAreaField({
  label,
  errorMessage,
  className,
  value,
  ...rest
}: TextAreaFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = () => {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useLayoutEffect(fit, [value]);
  // A largura muda com a janela e isso muda quantas linhas o texto ocupa.
  useEffect(() => {
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-label">
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        value={value}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        className={cn(fieldControlClass, 'resize-none overflow-hidden py-2 leading-relaxed')}
        {...rest}
      />
      {errorMessage ? (
        <p id={errorId} className="text-danger mt-1 text-body-sm">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
