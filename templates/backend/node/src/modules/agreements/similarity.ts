// Detecta combinados que descrevem a mesma ação com palavras parecidas, para o Bonsai não salvar
// repetidos (modelos de IA diferentes repetem de jeitos diferentes). Compara só o texto: o
// responsável não conta, porque "a pessoa testa" e "o líder testa" é a mesma ação.

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das', 'no', 'na',
  'nos', 'nas', 'em', 'para', 'pra', 'por', 'com', 'e', 'ou', 'que', 'se', 'ja', 'ate', 'ao',
  'aos', 'dele', 'dela', 'deles', 'delas', 'seu', 'sua', 'seus', 'suas', 'ele', 'ela', 'voce',
  'mais', 'ainda', 'muito', 'sobre', 'entre', 'como', 'quando', 'esse', 'essa', 'este', 'esta',
]); // prettier-ignore

const STEM_LENGTH = 5;
const MIN_TOKENS_FOR_PARTIAL_MATCH = 3;
const OVERLAP_THRESHOLD = 0.75;

// Palavras significativas, sem acento, em minúsculas e cortadas no começo ("testar" e "teste" se
// aproximam). Números e siglas curtas contam ("RH", "Q4").
export const actionTokens = (description: string): Set<string> => {
  const words = description
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 2 && !STOPWORDS.has(word));
  return new Set(words.map((word) => word.slice(0, STEM_LENGTH)));
};

// Mesma ação quando um texto contém o outro (pelo menos 75% das palavras do mais curto). Com
// menos de 3 palavras só vale se forem as mesmas, para não confundir "Enviar proposta" com
// "Enviar relatório".
export const isSameAction = (first: string, second: string): boolean => {
  const a = actionTokens(first);
  const b = actionTokens(second);
  const smaller = Math.min(a.size, b.size);
  if (smaller === 0) return false;

  const shared = [...a].filter((token) => b.has(token)).length;
  if (smaller < MIN_TOKENS_FOR_PARTIAL_MATCH) return a.size === b.size && shared === a.size;
  return shared / smaller >= OVERLAP_THRESHOLD;
};

// Mantém a ordem e descarta o que repete outro item da própria lista ou algo que já existe.
export const dropRepeatedActions = <T extends { description: string }>(
  items: readonly T[],
  alreadySaved: readonly string[],
): { kept: T[]; dropped: T[] } => {
  const seen = [...alreadySaved];
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const item of items) {
    if (seen.some((text) => isSameAction(text, item.description))) {
      dropped.push(item);
      continue;
    }
    seen.push(item.description);
    kept.push(item);
  }
  return { kept, dropped };
};
