export type TitleSource = 'fallback' | 'ai' | 'leader';

export type Responsibility = {
  id: string;
  position: number;
  title: string;
  titleSource: TitleSource;
  // Frase completa, como a líder escreveu.
  text: string;
  // Aposentada: saiu do responsograma numa versão anterior (o histórico dela continua).
  retired: boolean;
};

// O que o servidor propõe ao ler um arquivo: a líder confere nos campos antes de salvar.
export type Proposal = {
  mission?: string;
  responsibilities: string[];
  leftOut: string[];
};
