import type { ComponentPropsWithoutRef } from 'react';
import { Link } from 'react-router-dom';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './Button';

// Link de navegação com a aparência de botão. Aceita os atributos nativos de <a> (to, aria-*).
export type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}
