import { cn } from '@/lib/cn';

const SYMBOL_VIEWBOX = '6 5 36 39';
const SYMBOL_RATIO = 36 / 39;

// Proporções da marca (frontend/BRAND.md): fonte do logotipo e espaço, relativos à altura do símbolo.
const WORDMARK = {
  horizontal: { fontScale: 0.74, gapScale: 0.26 },
  vertical: { fontScale: 0.5, gapScale: 0.2 },
} as const;

// Alturas do símbolo = tokens --logo-topbar-h (barra superior) e --logo-login-h (login, vertical).
const SIZE_PRESETS = { topbar: 28, login: 52 } as const;

// Mínimos da marca = tokens --logo-min-symbol e --logo-min-horizontal.
const MIN_SYMBOL_PX = 16;
// Símbolo de 21 px de altura já dá ~72 px de largura no logo horizontal (mínimo da marca).
const MIN_HORIZONTAL_SYMBOL_PX = 21;

const tones = {
  // Cor do tema: Musgo no claro, Musgo claro no escuro; texto na cor de texto do tema.
  brand: { symbol: 'text-primary', word: 'text-text', pill: 'bg-primary' },
  black: { symbol: 'text-brand-black', word: 'text-brand-black', pill: 'bg-brand-black' },
  white: { symbol: 'text-brand-white', word: 'text-brand-white', pill: 'bg-brand-white' },
} as const;

export type LogoProps = {
  variant?: 'horizontal' | 'vertical' | 'simbolo';
  // Altura do símbolo em px, ou um preset: `topbar` (28 px) e `login` (52 px, use com a variante vertical).
  size?: number | keyof typeof SIZE_PRESETS;
  // `brand` segue o tema; `black` e `white` são as versões monocromáticas.
  tone?: keyof typeof tones;
  className?: string;
};

// Símbolo: três copas e o tronco (retângulos de cantos totalmente arredondados). Não redesenhar.
function Symbol({ height }: { height: number }) {
  return (
    <svg
      width={height * SYMBOL_RATIO}
      height={height}
      viewBox={SYMBOL_VIEWBOX}
      aria-hidden="true"
      className="block flex-none"
      fill="currentColor"
    >
      <rect x="16" y="5" width="20" height="9" rx="4.5" />
      <rect x="6" y="17.5" width="26" height="9" rx="4.5" />
      <rect x="15" y="30" width="27" height="9" rx="4.5" />
      <rect x="22" y="37" width="6" height="7" rx="1.5" />
    </svg>
  );
}

// "bonsaı" com ı sem pingo (U+0131); sobre ele, uma pílula de 0,24em × 0,115em a 0,17em do topo.
function Wordmark({
  fontSize,
  nudge,
  className,
  pillClassName,
}: {
  fontSize: number;
  nudge: number;
  className: string;
  pillClassName: string;
}) {
  return (
    <span
      className={cn('font-display font-medium whitespace-nowrap', className)}
      style={{ fontSize, marginTop: nudge, letterSpacing: 'var(--tracking-tight)' }}
    >
      bonsa
      <span className="relative">
        {'\u0131'}
        <span
          aria-hidden="true"
          className={cn('absolute left-1/2 rounded-full', pillClassName)}
          style={{ top: '0.17em', width: '0.24em', height: '0.115em', marginLeft: '-0.12em' }}
        />
      </span>
    </span>
  );
}

export function Logo({
  variant = 'horizontal',
  size = 'topbar',
  tone = 'brand',
  className,
}: LogoProps) {
  const colors = tones[tone];
  const symbolHeight = typeof size === 'number' ? size : SIZE_PRESETS[size];

  if (variant === 'simbolo') {
    return (
      <span role="img" aria-label="Bonsai" className={cn('inline-flex', colors.symbol, className)}>
        <Symbol height={Math.max(symbolHeight, MIN_SYMBOL_PX)} />
      </span>
    );
  }

  const layout = WORDMARK[variant];
  const isHorizontal = variant === 'horizontal';
  const height = Math.max(symbolHeight, isHorizontal ? MIN_HORIZONTAL_SYMBOL_PX : MIN_SYMBOL_PX);

  return (
    <span
      role="img"
      aria-label="Bonsai"
      className={cn(
        'inline-flex items-center align-middle leading-none',
        isHorizontal ? 'flex-row' : 'flex-col',
        colors.symbol,
        className,
      )}
      style={{ gap: height * layout.gapScale }}
    >
      <Symbol height={height} />
      <Wordmark
        fontSize={height * layout.fontScale}
        nudge={isHorizontal ? -height * 0.04 : 0}
        className={colors.word}
        pillClassName={colors.pill}
      />
    </span>
  );
}
