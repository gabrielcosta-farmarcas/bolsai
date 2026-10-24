import { buildMapBlock, type AnalysisInputContext } from '../analyses/analysis-input.js';

export type PreparationHistoryItem = {
  heldOn: string;
  summary: string;
  themes: Array<{ title: string; detail: string }>;
  attentionPoints: string[];
  leaderNotes: string;
};

export type PreparationInputContext = {
  today: string;
  map: AnalysisInputContext['map'];
  history: PreparationHistoryItem[];
  openAgreements: Array<{
    description: string;
    owner: 'leader' | 'report';
    dueDate: string | null;
    isOverdue: boolean;
  }>;
  // Responsabilidades que não apareceram nos encontros recentes (título e frase completa).
  gaps: Array<{ title: string; text: string; lastDiscussedOn: string | null }>;
};

const historyBlock = (item: PreparationHistoryItem): string => {
  const themes = item.themes.map((theme) => `- ${theme.title}: ${theme.detail}`).join('\n');
  const attention = item.attentionPoints.map((point) => `- ${point}`).join('\n');
  return [
    `<encontro data="${item.heldOn}">`,
    `Resumo: ${item.summary}`,
    themes ? `Temas:\n${themes}` : '',
    attention ? `Pontos de atenção:\n${attention}` : '',
    item.leaderNotes.trim()
      ? `Lembretes da líder para o próximo encontro: ${item.leaderNotes.trim()}`
      : '',
    '</encontro>',
  ]
    .filter(Boolean)
    .join('\n');
};

// Monta a mensagem do usuário. O conteúdo das tags é dado, nunca instrução (o prompt do sistema avisa).
export const buildPreparationInput = (context: PreparationInputContext): string => {
  const map = context.map
    ? buildMapBlock(context.map)
    : '<responsograma>Nenhum responsograma cadastrado.</responsograma>';

  const history =
    context.history.length > 0
      ? context.history.map(historyBlock).join('\n')
      : 'Nenhum encontro anterior revisado.';

  const agreements =
    context.openAgreements.length > 0
      ? context.openAgreements
          .map(
            (item) =>
              `<combinado responsavel="${item.owner}" prazo="${item.dueDate ?? 'sem prazo'}" atrasado="${item.isOverdue ? 'sim' : 'nao'}">${item.description}</combinado>`,
          )
          .join('\n')
      : 'Nenhum combinado em aberto.';

  const gaps =
    context.gaps.length > 0
      ? context.gaps
          .map(
            (item) =>
              `<responsabilidade titulo="${item.title}" ultima_conversa="${item.lastDiscussedOn ?? 'nunca'}">${item.text}</responsabilidade>`,
          )
          .join('\n')
      : 'Nenhuma: todas as responsabilidades apareceram nos encontros recentes.';

  return [
    `<hoje>${context.today}</hoje>`,
    map,
    `<historico>\n${history}\n</historico>`,
    `<combinados_em_aberto>\n${agreements}\n</combinados_em_aberto>`,
    `<responsabilidades_pouco_conversadas>\n${gaps}\n</responsabilidades_pouco_conversadas>`,
  ].join('\n\n');
};
