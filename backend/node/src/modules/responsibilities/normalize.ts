export const MAX_TITLE_LENGTH = 60;

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim();

// Chave que decide se dois textos são "a mesma responsabilidade": ignora maiúsculas e espaços
// sobrando. Acentos contam (palavras diferentes), mas o mesmo acento escrito de dois jeitos é igual.
export const normalizeKey = (text: string): string =>
  collapse(text.normalize('NFC')).toLocaleLowerCase('pt-BR');

// Título de reserva enquanto a IA não sugere um: o começo da frase, em palavras inteiras, até 60 caracteres.
export const provisionalTitle = (text: string): string => {
  const clean = collapse(text);
  if (clean.length <= MAX_TITLE_LENGTH) return clean;

  const room = clean.slice(0, MAX_TITLE_LENGTH - 1);
  const lastSpace = room.lastIndexOf(' ');
  const cut = lastSpace > 0 ? room.slice(0, lastSpace) : room;
  return `${cut.replace(/[\s,;:.\-–]+$/u, '')}…`;
};
