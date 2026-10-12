import Anthropic from '@anthropic-ai/sdk';

export type KeyCheck = 'ok' | 'rejected' | 'unreachable';

// Confere a chave listando modelos (não gasta tokens). Nunca registra a chave em log.
export const validateAnthropicKey = async (apiKey: string): Promise<KeyCheck> => {
  try {
    await new Anthropic({ apiKey, maxRetries: 0, timeout: 10_000 }).models.list({ limit: 1 });
    return 'ok';
  } catch (error) {
    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError
    ) {
      return 'rejected';
    }
    return 'unreachable';
  }
};
