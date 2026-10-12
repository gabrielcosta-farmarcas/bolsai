import { env } from '../../config/env.js';
import type { AiClient } from '../../shared/ai/ai-client.js';
import { makeAnthropicClient } from '../../shared/ai/anthropic-client.js';
import { loadPrompt } from '../../shared/ai/prompt-loader.js';
import { validateAnthropicKey } from '../../shared/ai/validate-api-key.js';
import { loadKey } from '../../shared/security/session-crypto.js';
import { settingsRepository } from './settings.repository.js';
import { makeSettingsService } from './settings.service.js';

export const ANALYSIS_PROMPT_NAME = 'analysis-1on1';

// Serviço único usado pelas rotas e pela IA (análise e títulos): a configuração da líder vale em todo lugar.
export const settingsService = makeSettingsService({
  repo: settingsRepository,
  key: env.SESSION_ENCRYPTION_KEY ? loadKey(env.SESSION_ENCRYPTION_KEY) : null,
  validateKey: validateAnthropicKey,
  installation: () => ({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL }),
  loadDefaultPrompt: () => loadPrompt(ANALYSIS_PROMPT_NAME),
});

export const getAiClientFor = async (leaderId: string): Promise<AiClient> =>
  makeAnthropicClient(await settingsService.resolveAiConfig(leaderId));
