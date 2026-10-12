export type AgreementOwner = 'leader' | 'report';
export type AgreementStatus = 'open' | 'done' | 'cancelled';
export type AgreementStatusFilter = AgreementStatus | 'overdue' | 'all';

export type Agreement = {
  id: string;
  directReportId: string;
  directReportName: string;
  originSessionId: string | null;
  analysisId: string | null;
  description: string;
  owner: AgreementOwner;
  dueDate: string | null;
  status: AgreementStatus;
  isOverdue: boolean;
  evidenceExcerpt: string | null;
  origin: 'ai' | 'leader';
  // Falso enquanto o combinado é da IA e o líder ainda não editou nem revisou.
  isConfirmed: boolean;
  closedAt: string | null;
  createdAt: string;
};

export type AgreementPatch = {
  description?: string;
  owner?: AgreementOwner;
  dueDate?: string | null;
  status?: AgreementStatus;
};

export type NewAgreementInput = {
  description: string;
  owner: AgreementOwner;
  dueDate: string | null;
  sessionId?: string;
};
