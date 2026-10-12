import { useId, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

// Aceita os atributos nativos de <input> (type, value, onChange, required, ...).
export type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'id'> & {
  label: string;
  errorMessage?: string;
};

export const fieldControlClass = cn(
  'border-border-strong bg-surface text-text w-full rounded-md border px-3 text-body',
  'placeholder:text-text-muted ',
  'aria-invalid:border-danger disabled:opacity-50',
);

export function TextField({ label, errorMessage, className, ...rest }: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-label">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        className={cn(fieldControlClass, 'h-[var(--control-h)]')}
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
