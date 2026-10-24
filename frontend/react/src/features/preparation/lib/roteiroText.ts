import { formatCalendarDate } from '@/lib/format';
import type { PreparationContent } from '../types';

// Texto do roteiro para colar em anotações: perguntas primeiro, depois o contexto, uma linha por item.
export const buildRoteiroText = (content: PreparationContent): string => {
  const lines = [
    'Perguntas',
    ...content.questions.map((question, index) => `${index + 1}. ${question}`),
  ];

  if (content.open_agreements.length > 0) {
    lines.push('', 'Combinados em aberto');
    for (const item of content.open_agreements) {
      const owner = item.owner === 'leader' ? 'Você' : 'A pessoa';
      const due = item.due_date ? `prazo ${formatCalendarDate(item.due_date)}` : 'sem prazo';
      lines.push(`- ${item.description} (${owner}, ${due}${item.is_overdue ? ', atrasado' : ''})`);
    }
  }
  if (content.themes.length > 0) {
    lines.push('', 'Temas para retomar', ...content.themes.map((theme) => `- ${theme.title}`));
  }
  if (content.map_gaps.length > 0) {
    lines.push('', 'Pouco conversadas', ...content.map_gaps.map((gap) => `- ${gap.title}`));
  }
  return lines.join('\n');
};
