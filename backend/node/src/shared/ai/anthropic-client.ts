import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { AiResponseError, type AiClient } from './ai-client.js';

// Folga para a análise inteira (JSON de poucos KB) sem exigir streaming.
const MAX_OUTPUT_TOKENS = 16_000;

// Saída estruturada (output_config.format): vale para todos os modelos atuais, inclusive os que
// recusam tool_choice forçado. O texto cai em content[0] e o chamador valida com Zod.
export type AiConfig = { apiKey: string; model: string };

export const makeAnthropicClient = ({ apiKey, model }: AiConfig): AiClient => {
  const client = new Anthropic({ apiKey });

  return {
    async generateStructured({ system, user, outputSchema }) {
      const response = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        messages: [{ role: 'user', content: user }],
        output_config: { format: zodOutputFormat(outputSchema) },
      });

      if (response.stop_reason === 'refusal') {
        throw new AiResponseError('A IA recusou a solicitação.');
      }
      if (response.stop_reason === 'max_tokens') {
        throw new AiResponseError('A resposta da IA foi cortada por ser longa demais.');
      }
      const block = response.content.find((item) => item.type === 'text');
      if (!block || block.type !== 'text') throw new AiResponseError('A IA não devolveu texto.');

      return {
        text: block.text,
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    },
  };
};
