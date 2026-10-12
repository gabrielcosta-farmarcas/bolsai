export type Owner = 'leader' | 'report';
export type PreviousStatus = 'done' | 'in_progress' | 'not_mentioned' | 'cancelled';
export type SignalKind = 'growth' | 'attention' | 'neutral';

export type Agreement = {
  id?: string;
  description: string;
  owner: Owner;
  due_date: string | null;
  evidence_excerpt: string;
};

export type LeaderOverall = 'went_well' | 'mixed' | 'room_to_improve';

// Feedback sobre a condução do líder. Só para ele: não vai para a pessoa nem para a exportação.
export type LeaderFeedback = {
  overall: LeaderOverall;
  overall_note: string;
  strengths: Array<{ point: string; evidence: string }>;
  opportunities: Array<{ point: string; suggestion: string; evidence: string }>;
};

export type AnalysisContent = {
  summary: string;
  themes: Array<{ title: string; detail: string }>;
  agreements: Agreement[];
  previous_agreements: Array<{ id: string; suggested_status: PreviousStatus; evidence: string }>;
  // Cada observação aponta para o id de uma responsabilidade da pessoa (ou nulo: fora das responsabilidades).
  development_signals: Array<{
    responsibility_id: string | null;
    observation: string;
    kind: SignalKind;
  }>;
  attention_points: string[];
  next_questions: string[];
  private_leader_notes: string;
  // Ausente em análises feitas antes deste campo existir.
  leader_feedback?: LeaderFeedback;
};

// Responsabilidade da pessoa para escolher na revisão e mostrar na leitura (ativas e aposentadas).
export type ResponsibilityOption = { id: string; title: string; retired: boolean };

export type AnalysisStatus = 'processing' | 'completed' | 'failed';

export type AnalysisSummary = {
  id: string;
  sessionId: string;
  model: string | null;
  status: AnalysisStatus;
  errorMessage: string | null;
  mapVersionUsed: number | null;
  isFinal: boolean;
  reviewedAt: string | null;
  createdAt: string;
};

export type AnalysisDetail = AnalysisSummary & {
  rawJson: AnalysisContent | null;
  reviewedJson: AnalysisContent | null;
};
