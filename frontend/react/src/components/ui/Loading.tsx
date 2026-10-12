import { cn } from '@/lib/cn';

export type LoadingProps = {
  // Texto ao lado do símbolo; também é o que leitores de tela anunciam.
  label: string;
  // Texto de apoio abaixo do rótulo.
  hint?: string;
  className?: string;
};

// Símbolo da marca com as três copas acendendo em sequência (animação `bonsai-pulse` em globals.css).
export function Loading({ label, hint, className }: LoadingProps) {
  return (
    <div role="status" className={cn('flex flex-col items-center gap-4 text-center', className)}>
      <svg
        width={48}
        height={52}
        viewBox="6 5 36 39"
        aria-hidden="true"
        className="text-primary block"
        fill="currentColor"
      >
        <rect className="bonsai-pulse" x="16" y="5" width="20" height="9" rx="4.5" />
        <rect
          className="bonsai-pulse"
          style={{ animationDelay: '0.25s' }}
          x="6"
          y="17.5"
          width="26"
          height="9"
          rx="4.5"
        />
        <rect
          className="bonsai-pulse"
          style={{ animationDelay: '0.5s' }}
          x="15"
          y="30"
          width="27"
          height="9"
          rx="4.5"
        />
        <rect x="22" y="37" width="6" height="7" rx="1.5" />
      </svg>
      <div>
        <p className="text-body-lg">{label}</p>
        {hint ? <p className="text-caption mt-1">{hint}</p> : null}
      </div>
    </div>
  );
}
