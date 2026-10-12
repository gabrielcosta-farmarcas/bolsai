export type SignalKind = 'growth' | 'attention' | 'neutral';

export type TimelineAgreement = {
  id: string;
  description: string;
  owner: 'leader' | 'report';
  dueDate: string | null;
  status: 'open' | 'done' | 'cancelled';
  isOverdue: boolean;
};

export type TimelineEntry = {
  sessionId: string;
  heldOn: string;
  isReviewed: boolean;
  summary: string | null;
  themes: Array<{ title: string; detail: string }>;
  signals: Array<{
    responsibilityId: string | null;
    responsibility: string;
    observation: string;
    kind: SignalKind;
  }>;
  agreements: TimelineAgreement[];
};

export type Timeline = {
  entries: TimelineEntry[];
  responsibilities: Array<{
    id: string | null;
    responsibility: string;
    // Frase completa da responsabilidade (nula para "fora das responsabilidades" ou removida).
    text: string | null;
    points: Array<{ sessionId: string; heldOn: string; kind: SignalKind }>;
  }>;
  totals: { agreements: number; done: number; open: number; cancelled: number; overdue: number };
};
