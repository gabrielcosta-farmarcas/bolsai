import type { SignalKind } from '../types';

// Cor e texto de cada tipo de sinal. A cor nunca é o único sinal: sempre vem com o texto.
export const SIGNAL_LABEL: Record<SignalKind, string> = {
  growth: 'evolução',
  attention: 'ponto de atenção',
  neutral: 'neutro',
};

export const SIGNAL_FILL: Record<SignalKind, string> = {
  growth: 'bg-success',
  attention: 'bg-warning',
  neutral: 'bg-border-strong',
};
