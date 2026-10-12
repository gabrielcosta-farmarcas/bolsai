export type DirectReportStatus = 'active' | 'inactive';

export type DirectReport = {
  id: string;
  name: string;
  role: string;
  startedAt: string;
  status: DirectReportStatus;
  createdAt: string;
  updatedAt: string;
  // Resumo para a lista: último encontro (AAAA-MM-DD) e combinados em aberto.
  lastSessionOn: string | null;
  openAgreements: number;
};

export type DirectReportInput = {
  name: string;
  role: string;
  startedAt: string;
  status: DirectReportStatus;
  // Só no cadastro: viram a versão 1 do responsograma (de 3 a 10 responsabilidades, uma por campo).
  mission?: string;
  responsibilities?: string[];
};

// Uma versão do responsograma. `responsibilities` é a lista numerada, uma por linha, só para exibir.
export type ResponsibilityMap = {
  id: string;
  version: number;
  isCurrent: boolean;
  mission: string | null;
  responsibilities: string | null;
  createdAt: string;
};

export type MapSave = { mission: string; responsibilities: string[] };

export type StatusFilter = DirectReportStatus | 'all';
