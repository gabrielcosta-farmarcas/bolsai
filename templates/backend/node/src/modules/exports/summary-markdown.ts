import { reviewedAnalysisSchema } from '../analyses/analysis.schema.js';

const OWNER_LABEL = { leader: 'Líder', report: 'Liderado' } as const;

const formatDate = (calendarDate: string) => {
  const [year, month, day] = calendarDate.split('-');
  return `${day}/${month}/${year}`;
};

// Só entram resumo, temas e combinados da versão final. Notas privadas, feedback da líder, sinais
// de evolução, trechos da conversa e a transcrição nunca passam por aqui (lista fechada de campos).
export const buildSummaryMarkdown = (input: {
  reportName: string;
  heldOn: string;
  reviewedJson: unknown;
}): string => {
  const content = reviewedAnalysisSchema.parse(input.reviewedJson);

  const lines = [`# Resumo do 1:1 com ${input.reportName} — ${formatDate(input.heldOn)}`, ''];
  lines.push('## Resumo', '', content.summary.trim(), '');

  if (content.themes.length > 0) {
    lines.push('## Temas conversados', '');
    for (const theme of content.themes) {
      const detail = theme.detail.trim();
      lines.push(detail ? `- **${theme.title.trim()}**: ${detail}` : `- **${theme.title.trim()}**`);
    }
    lines.push('');
  }

  lines.push('## Combinados', '');
  if (content.agreements.length === 0) {
    lines.push('Nenhum combinado neste encontro.');
  } else {
    for (const agreement of content.agreements) {
      const due = agreement.due_date ? `prazo ${formatDate(agreement.due_date)}` : 'sem prazo';
      lines.push(`- ${agreement.description.trim()} (${OWNER_LABEL[agreement.owner]}, ${due})`);
    }
  }

  return `${lines.join('\n')}\n`;
};
