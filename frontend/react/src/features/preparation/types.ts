export type PreparationStatus = 'processing' | 'completed' | 'failed';

export type PreparationContent = {
  // Combinados em aberto da pessoa no momento em que o roteiro foi gerado.
  open_agreements: Array<{
    id: string;
    description: string;
    owner: 'leader' | 'report';
    due_date: string | null;
    is_overdue: boolean;
  }>;
  themes: Array<{ title: string; detail: string }>;
  questions: string[];
  // Responsabilidades pouco conversadas; `last_discussed_on` nulo = nunca foi conversada.
  map_gaps: Array<{
    responsibility_id: string;
    title: string;
    last_discussed_on: string | null;
  }>;
  has_history: boolean;
};

export type Preparation = {
  id: string;
  directReportId: string;
  status: PreparationStatus;
  errorMessage: string | null;
  model: string | null;
  createdAt: string;
  content: PreparationContent | null;
};
