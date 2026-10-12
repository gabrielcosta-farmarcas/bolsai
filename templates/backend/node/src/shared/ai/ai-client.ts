import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error.js';

export type StructuredRequest = {
  system: string;
  user: string;
  // Schema Zod da saída esperada. O cliente o converte em JSON Schema para a API.
  outputSchema: ZodType;
};

export type StructuredResponse = {
  // Texto JSON devolvido pela IA. Quem chama faz o parse e a validação (e decide o retry).
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

// Fronteira com a IA. Os services só conhecem esta interface (testes usam o cliente falso).
export type AiClient = {
  generateStructured: (request: StructuredRequest) => Promise<StructuredResponse>;
};

export class AiNotConfiguredError extends AppError {
  constructor(
    message = 'A análise por IA não está configurada. Cadastre a chave e escolha o modelo em Configurações.',
  ) {
    super(message, 503, 'AI_NOT_CONFIGURED');
  }
}

// A IA respondeu, mas não entregou texto utilizável (recusa, resposta cortada).
export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiResponseError';
  }
}
