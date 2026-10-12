import { cn } from '@/lib/cn';

export type AvatarProps = {
  name: string;
  className?: string;
};

// Iniciais (primeira e última palavra do nome) em círculo primary-subtle.
export const initialsOf = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
};

export function Avatar({ name, className }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-primary-subtle text-primary flex size-10 flex-none items-center justify-center rounded-full text-label',
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
