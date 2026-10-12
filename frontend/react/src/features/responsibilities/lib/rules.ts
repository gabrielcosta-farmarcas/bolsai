// Regras dos campos de responsabilidade, iguais às do servidor (que decide de verdade): de 3 a 10 textos
// diferentes, cada um de 3 a 1.000 caracteres. A tela só adianta a mensagem para a líder.
export const FIELD_COUNT = 10;
export const MIN_RESPONSIBILITIES = 3;
export const MIN_LENGTH = 3;
export const MAX_LENGTH = 1000;

export const emptyFields = (): string[] => Array.from({ length: FIELD_COUNT }, () => '');

// Preenche os campos do começo e deixa o resto vazio (corta se passar de 10).
export const fieldsFrom = (texts: string[]): string[] =>
  Array.from({ length: FIELD_COUNT }, (_, index) => texts[index] ?? '');

const keyOf = (text: string) =>
  text.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');

export const filledTexts = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter((value) => value.length > 0);

export const countFilled = (values: string[]): number => filledTexts(values).length;

const distinctCount = (values: string[]): number => new Set(filledTexts(values).map(keyOf)).size;

export const duplicateCount = (values: string[]): number =>
  countFilled(values) - distinctCount(values);

// Mensagem de regra descumprida (ou nada, se está tudo certo). A ordem é a do servidor.
export const rulesMessage = (values: string[]): string | undefined => {
  for (const [index, value] of values.entries()) {
    const length = value.trim().length;
    if (length > 0 && (length < MIN_LENGTH || length > MAX_LENGTH)) {
      return `Responsabilidade ${index + 1}: escreva de ${MIN_LENGTH} a ${MAX_LENGTH} caracteres.`;
    }
  }
  const missing = MIN_RESPONSIBILITIES - distinctCount(values);
  if (missing > 0) {
    return `Preencha pelo menos ${MIN_RESPONSIBILITIES} responsabilidades. ${missing === 1 ? 'Falta 1' : `Faltam ${missing}`}.`;
  }
  return undefined;
};
