import { MAX_RESPONSIBILITIES, MIN_RESPONSIBILITY_LENGTH } from './responsibilities.schemas.js';
import { normalizeKey } from './normalize.js';

export type Proposal = {
  mission?: string;
  responsibilities: string[];
  // Parágrafos que passaram do limite de 10 e não entraram nos campos.
  leftOut: string[];
};

const BULLET = /^\s*(?:[•·▪●○*\-–—]|\(?\d{1,2}[.)]|\(?[a-z][.)])\s+/iu;
const MAX_HEADING_LENGTH = 60;

const isMissionHeading = (text: string) =>
  text.length <= MAX_HEADING_LENGTH && /^(miss[aã]o|finalidade)/iu.test(text);

const isResponsibilitiesHeading = (text: string) =>
  text.length <= MAX_HEADING_LENGTH &&
  /^(responsabilidades|atribui[cç][õo]es|principais atividades)/iu.test(text);

const clean = (text: string) => text.replace(BULLET, '').replace(/\s+/g, ' ').trim();

// Divide o texto lido de um arquivo em partes para preencher os campos: só uma PROPOSTA,
// a líder confere e ajusta antes de salvar.
export const splitProposal = (text: string): Proposal => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { responsibilities: [], leftOut: [] };

  const byBlankLine = trimmed.split(/\n\s*\n/);
  const chunks = (byBlankLine.length > 1 ? byBlankLine : trimmed.split('\n'))
    .map(clean)
    .filter((chunk) => chunk.length > 0);

  let mission: string | undefined;
  const candidates: string[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index] ?? '';
    if (isMissionHeading(chunk)) {
      const next = chunks[index + 1];
      if (next && !isResponsibilitiesHeading(next)) {
        mission = next;
        index += 1;
      }
      continue;
    }
    if (isResponsibilitiesHeading(chunk)) continue;
    candidates.push(chunk);
  }

  const seen = new Set<string>();
  const unique = candidates.filter((chunk) => {
    if (chunk.length < MIN_RESPONSIBILITY_LENGTH) return false;
    const key = normalizeKey(chunk);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    ...(mission ? { mission } : {}),
    responsibilities: unique.slice(0, MAX_RESPONSIBILITIES),
    leftOut: unique.slice(MAX_RESPONSIBILITIES),
  };
};
