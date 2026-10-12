import { useId, type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';
import { fieldControlClass } from './TextField';

export type SelectOption = { value: string; label: string };

// Aceita os atributos nativos de <select> (value, onChange, disabled, ...).
export type SelectFieldProps = Omit<ComponentPropsWithoutRef<'select'>, 'id' | 'children'> & {
  label: string;
  options: readonly SelectOption[];
};

export function SelectField({ label, options, className, ...rest }: SelectFieldProps) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-label">
        {label}
      </label>
      <select id={id} className={cn(fieldControlClass, 'h-[var(--control-h)]')} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
