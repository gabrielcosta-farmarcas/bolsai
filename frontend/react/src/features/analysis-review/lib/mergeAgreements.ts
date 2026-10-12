import type { Agreement, AnalysisContent } from '../types';

export type AgreementRow = {
  id: string;
  analysisId: string | null;
  description: string;
  owner: Agreement['owner'];
  dueDate: string | null;
  evidenceExcerpt: string | null;
  status: 'open' | 'done' | 'cancelled';
};

// A lista de combinados da tela de revisão parte dos combinados já salvos (com id), para a revisão
// atualizar os mesmos registros em vez de criar cópias. Só vale para a análise que os gerou ou para a
// versão final; em outra análise (reprocessada) vale o que ela trouxe.
export function withSavedAgreements(
  content: AnalysisContent,
  rows: readonly AgreementRow[] | undefined,
  analysisId: string,
  isFinal: boolean,
): AnalysisContent {
  if (!rows) return content;
  const isSource = rows.some((row) => row.analysisId === analysisId);
  if (!isSource && !isFinal) return content;

  return {
    ...content,
    agreements: rows
      .filter((row) => row.status !== 'cancelled')
      .map((row) => ({
        id: row.id,
        description: row.description,
        owner: row.owner,
        due_date: row.dueDate,
        evidence_excerpt: row.evidenceExcerpt ?? '',
      })),
  };
}
