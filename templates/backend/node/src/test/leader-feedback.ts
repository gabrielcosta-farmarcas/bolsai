import type { LeaderFeedback } from '../modules/analyses/analysis.schema.js';

// Feedback do líder de exemplo para os testes.
export const sampleLeaderFeedback: LeaderFeedback = {
  overall: 'mixed',
  overall_note: 'Boa escuta, mas os combinados do líder ficaram vagos.',
  strengths: [{ point: 'Deu espaço para a pessoa falar.', evidence: 'Me conta mais.' }],
  opportunities: [
    {
      point: 'Combinado do líder sem prazo.',
      suggestion: 'Fechar um prazo para o retorno ao fim da conversa.',
      evidence: '',
    },
  ],
};
