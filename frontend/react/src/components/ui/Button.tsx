import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

const buttonVariant = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'border border-border bg-surface text-text hover:bg-primary-subtle',
  ghost: 'text-text hover:bg-primary-subtle',
  destructive: 'bg-danger text-on-primary hover:bg-danger/90',
} as const;

const buttonSize = {
  md: 'h-[var(--control-h)] px-4 text-label',
  sm: 'h-[var(--control-h-sm)] px-3 text-label',
} as const;

export type ButtonVariant = keyof typeof buttonVariant;
export type ButtonSize = keyof typeof buttonSize;

// Classes do botão, compartilhadas com ButtonLink (link com cara de botão).
export const buttonClasses = (
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) =>
  cn(
    'inline-flex items-center justify-center rounded-md font-semibold',
    'transition-colors ',
    'disabled:pointer-events-none disabled:opacity-50',
    buttonSize[size],
    buttonVariant[variant],
    className,
  );

// Aceita os atributos nativos de <button> (onClick, disabled, type, aria-*).
export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...rest} />;
}
