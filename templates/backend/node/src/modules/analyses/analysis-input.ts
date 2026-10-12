export type OpenAgreementContext = {
  id: string;
  description: string;
  owner: 'leader' | 'report';
  dueDate: string | null;
};

export type AnalysisInputContext = {
  heldOn: string;
  transcript: string;
  // Versão vigente do responsograma: missão (opcional) e TODAS as responsabilidades preenchidas, numeradas.
  map: {
    version: number;
    mission: string | null;
    responsibilities: Array<{ ref: string; text: string }>;
  } | null;
  history: Array<{ heldOn: string; summary: string }>;
  openAgreements: OpenAgreementContext[];
};

// Bloco do responsograma: a missão e a lista numerada (R1, R2…) com o texto COMPLETO de cada responsabilidade,
// sem cortar nem resumir. A IA aponta cada observação para um desses números.
const buildMapBlock = (map: NonNullable<AnalysisInputContext['map']>): string => {
  const mission = map.mission?.trim() ? `<missao>\n${map.mission.trim()}\n</missao>\n` : '';
  const list = map.responsibilities.map((item) => `${item.ref}: ${item.text}`).join('\n');
  return `<responsograma versao="${map.version}">\n${mission}<responsabilidades>\n${list}\n</responsabilidades>\n</responsograma>`;
};

// Monta a mensagem do usuário. Cada parte do contexto vai entre tags; o prompt do sistema
// explica que o conteúdo das tags é dado, nunca instrução.
export const buildAnalysisInput = (context: AnalysisInputContext): string => {
  const map = context.map
    ? buildMapBlock(context.map)
    : '<responsograma>Nenhum responsograma cadastrado.</responsograma>';

  const history =
    context.history.length > 0
      ? context.history
          .map((item) => `<encontro data="${item.heldOn}">\n${item.summary}\n</encontro>`)
          .join('\n')
      : 'Nenhum encontro anterior revisado.';

  const agreements =
    context.openAgreements.length > 0
      ? context.openAgreements
          .map(
            (item) =>
              `<combinado id="${item.id}" responsavel="${item.owner}" prazo="${item.dueDate ?? 'sem prazo'}">${item.description}</combinado>`,
          )
          .join('\n')
      : 'Nenhum combinado em aberto.';

  return [
    map,
    `<historico>\n${history}\n</historico>`,
    `<combinados_em_aberto>\n${agreements}\n</combinados_em_aberto>`,
    `<transcricao data_do_encontro="${context.heldOn}">\n${context.transcript}\n</transcricao>`,
  ].join('\n\n');
};
