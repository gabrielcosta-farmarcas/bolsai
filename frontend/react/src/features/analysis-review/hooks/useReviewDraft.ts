import { useState } from 'react';
import type { AnalysisContent } from '../types';

export function useReviewDraft(initial: AnalysisContent) {
  const [draft, setDraft] = useState<AnalysisContent>(initial);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const setField = <K extends keyof AnalysisContent>(field: K, value: AnalysisContent[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const problems = [
    draft.summary.trim().length === 0 ? 'O resumo não pode ficar vazio.' : null,
    draft.agreements.some((item) => item.description.trim().length === 0)
      ? 'Todo combinado precisa de uma descrição.'
      : null,
    draft.themes.some((item) => item.title.trim().length === 0)
      ? 'Todo tema precisa de um título.'
      : null,
    draft.development_signals.some((item) => item.observation.trim().length === 0)
      ? 'Todo sinal de desenvolvimento precisa de uma observação.'
      : null,
    draft.leader_feedback?.opportunities.some(
      (item) => item.point.trim().length === 0 || item.suggestion.trim().length === 0,
    )
      ? 'Toda oportunidade do seu feedback precisa de descrição e do que fazer.'
      : null,
    draft.leader_feedback?.strengths.some((item) => item.point.trim().length === 0)
      ? 'Todo ponto forte do seu feedback precisa de uma descrição.'
      : null,
  ].filter((message): message is string => message !== null);

  // Linhas vazias nas listas simples são descartadas ao salvar.
  const toSave = (): AnalysisContent => ({
    ...draft,
    attention_points: draft.attention_points.filter((item) => item.trim().length > 0),
    next_questions: draft.next_questions.filter((item) => item.trim().length > 0),
  });

  // Descarta as edições e volta ao conteúdo com que a tela abriu.
  const reset = () => setDraft(initial);

  return { draft, setField, problems, toSave, isDirty, reset };
}
