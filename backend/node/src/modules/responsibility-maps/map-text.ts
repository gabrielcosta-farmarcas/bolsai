// O responsograma tem a missão do cargo e as responsabilidades. O texto de cada versão é a junção delas,
// com os mesmos títulos usados nos documentos de cargo.
export const MISSION_TITLE = 'MISSÃO / FINALIDADE DO CARGO';
export const RESPONSIBILITIES_TITLE = 'RESPONSABILIDADES';

export type MapSections = { mission?: string | null; responsibilities?: string | null };

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
  ]
    .filter((part): part is string => part !== null)
    .join('\n\n');
