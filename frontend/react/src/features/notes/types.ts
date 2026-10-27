export type NoteKind = 'agreement_missed' | 'attention' | 'praise';
export type NoteStatus = 'no_plan' | 'in_progress' | 'resolved';
export type StepOwner = 'leader' | 'report';
export type NoteFilter = 'all' | NoteStatus;

export type NoteStep = {
  id: string;
  position: number;
  text: string;
  dueDate: string | null;
  owner: StepOwner;
  done: boolean;
  doneAt: string | null;
  isOverdue: boolean;
  // Preenchido quando o passo já virou Combinado.
  agreementId: string | null;
};

export type Note = {
  id: string;
  directReportId: string;
  kind: NoteKind;
  description: string;
  notedAt: string;
  status: NoteStatus;
  bringToNextSession: boolean;
  resolvedAt: string | null;
  createdAt: string;
  steps: NoteStep[];
  progress: { done: number; total: number };
};

export type NoteList = {
  data: Note[];
  counts: { all: number; no_plan: number; in_progress: number; resolved: number };
};

export type NoteInput = { kind: NoteKind; description: string; notedAt: string };

export type NotePatch = Partial<NoteInput> & { resolved?: boolean; bringToNextSession?: boolean };

export type StepInput = { text: string; dueDate: string | null; owner: StepOwner };

export type StepPatch = Partial<StepInput> & { done?: boolean };

export const KIND_LABEL: Record<NoteKind, string> = {
  agreement_missed: 'Combinado não cumprido',
  attention: 'Ponto de atenção',
  praise: 'Elogio',
};

export const OWNER_LABEL: Record<StepOwner, string> = { leader: 'Você', report: 'A pessoa' };
