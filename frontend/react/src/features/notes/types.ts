export type NoteKind = 'agreement_missed' | 'attention' | 'praise';
export type NoteStatus = 'open' | 'resolved';
export type AgreementOwner = 'leader' | 'report';
export type NoteFilter = 'all' | NoteStatus;

// Combinado ligado à anotação (o mesmo que aparece na aba Combinados da pessoa).
export type NoteAgreement = {
  id: string;
  description: string;
  owner: AgreementOwner;
  dueDate: string | null;
  status: 'open' | 'done';
  isOverdue: boolean;
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
  agreements: NoteAgreement[];
};

export type NoteList = {
  data: Note[];
  counts: { all: number; open: number; resolved: number };
};

export type NoteInput = { kind: NoteKind; description: string; notedAt: string };

export type NotePatch = Partial<NoteInput> & { resolved?: boolean; bringToNextSession?: boolean };

export type NoteAgreementInput = {
  description: string;
  dueDate: string | null;
  owner: AgreementOwner;
};

export const KIND_LABEL: Record<NoteKind, string> = {
  agreement_missed: 'Combinado não cumprido',
  attention: 'Ponto de atenção',
  praise: 'Elogio',
};

export const OWNER_LABEL: Record<AgreementOwner, string> = { leader: 'Você', report: 'A pessoa' };
