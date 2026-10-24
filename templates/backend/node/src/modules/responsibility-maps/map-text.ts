// O responsograma tem a missão do cargo, as responsabilidades e os comportamentos desejados. O texto de cada versão é a junção delas,
// com os mesmos títulos usados nos documentos de cargo.
export const MISSION_TITLE = 'MISSÃO / FINALIDADE DO CARGO';
export const RESPONSIBILITIES_TITLE = 'RESPONSABILIDADES';
export const BEHAVIORS_TITLE = 'COMPORTAMENTOS DESEJADOS';

export type MapSections = {
  mission?: string | null;
  responsibilities?: string | null;
  behaviors?: string | null;
};

const clean = (value: string | null | undefined) => value?.trim() ?? '';

// Lista numerada: "1. texto" uma por linha.
export const composeResponsibilities = (items: Array<{ text: string }>): string =>
  items.map((item, index) => `${index + 1}. ${item.text}`).join('\n');

// Só entram as seções preenchidas.
export const composeMapText = (sections: MapSections): string =>
  [
    clean(sections.mission) ? `${MISSION_TITLE}\n${clean(sections.mission)}` : null,
    clean(sections.responsibilities)
      ? `${RESPONSIBILITIES_TITLE}\n${clean(sections.responsibilities)}`
      : null,
    clean(sections.behaviors) ? `${BEHAVIORS_TITLE}\n${clean(sections.behaviors)}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join('\n\n');
