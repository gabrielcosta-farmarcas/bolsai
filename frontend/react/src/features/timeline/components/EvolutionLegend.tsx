import { cn } from '@/lib/cn';
import type { SignalKind } from '../types';
import { SIGNAL_FILL } from './signalStyle';

const ITEMS: Array<{ kind: SignalKind; title: string; meaning: string }> = [
  { kind: 'growth', title: 'Evolução', meaning: 'houve avanço, com evidência na conversa' },
  {
    kind: 'attention',
    title: 'Ponto de atenção',
    meaning: 'pede apoio ou acompanhamento',
  },
  { kind: 'neutral', title: 'Neutro', meaning: 'foi tratada, sem avanço nem alerta' },
];

// Legenda da evolução: o marcador na cor de verdade, o nome e o que ele significa. A cor nunca vem sozinha.
export function EvolutionLegend() {
  return (
    <div className="bg-surface border-border mt-3 rounded-lg border p-4">
      <p className="text-label">Como ler</p>
      <p className="text-body-sm text-text-muted mt-1">
        Cada marcador é um encontro em que a responsabilidade foi citada, do mais antigo (à
        esquerda) ao mais recente. Passe o mouse no título, ou toque nele, para ver a frase
        completa.
      </p>
      <ul aria-label="Legenda dos marcadores" className="mt-3 grid gap-2">
        {ITEMS.map((item) => (
          <li key={item.kind} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={cn('block h-3 w-8 flex-none rounded-full', SIGNAL_FILL[item.kind])}
            />
            <span className="text-body-sm">
              <strong className="font-semibold">{item.title}:</strong> {item.meaning}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
