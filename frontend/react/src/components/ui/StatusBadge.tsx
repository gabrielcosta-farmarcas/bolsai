import { cn } from '@/lib/cn';

// Etiquetas (999 px). "agreement" é a etiqueta de combinado: accent-subtle com accent-text.
// Etiquetas (999 px). "agreement" é a etiqueta de combinado: accent-subtle com accent-text.
// Em tema claro, success e warning não têm contraste de texto sobre o próprio "subtle" (4,3:1):
// por isso "attention" usa texto `text` sobre warning-subtle.
const badgeTone = {
  neutral: 'bg-liquen text-text-muted',
  growth: 'bg-primary-subtle text-primary',
  agreement: 'bg-accent-subtle text-accent-text',
  attention: 'bg-warning-subtle text-text',
  danger: 'bg-danger-subtle text-danger',
} as const;

export type StatusBadgeProps = {
  tone?: keyof typeof badgeTone;
  children: string;
};

export function StatusBadge({ tone = 'neutral', children }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-3 py-1 text-caption leading-none font-semibold',
        badgeTone[tone],
      )}
    >
      {children}
    </span>
  );
}
