import type { AiClient, StructuredRequest, StructuredResponse } from './ai-client.js';

// Cliente falso para testes: devolve as respostas na ordem em que foram enfileiradas.
// Objeto vira JSON; string é devolvida como veio (para simular resposta inválida);
// Error é lançado (para simular falha de rede/API).
export const makeFakeAiClient = (outputs: unknown[]) => {
  const calls: StructuredRequest[] = [];
  const queue = [...outputs];

  const client: AiClient = {
    async generateStructured(request): Promise<StructuredResponse> {
      calls.push(request);
      if (queue.length === 0) throw new Error('FakeAiClient: sem resposta enfileirada');
      const next = queue.shift();
      if (next instanceof Error) throw next;
      const text = typeof next === 'string' ? next : JSON.stringify(next);
      return { text, model: 'fake-model', inputTokens: 10, outputTokens: 20 };
    },
  };

  return { client, calls };
};
