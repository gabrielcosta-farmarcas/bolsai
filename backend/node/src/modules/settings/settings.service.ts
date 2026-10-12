import { AiNotConfiguredError } from '../../shared/ai/ai-client.js';
import { AI_MODELS, isKnownModel } from '../../shared/ai/models.js';
import type { KeyCheck } from '../../shared/ai/validate-api-key.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { CurrentUser } from '../../shared/security/current-user.js';
import { decrypt, encrypt } from '../../shared/security/session-crypto.js';

export const PROMPT_MIN_CHARS = 200;
export const PROMPT_MAX_CHARS = 30_000;
const API_KEY_MIN_CHARS = 20;
const API_KEY_MAX_CHARS = 300;

export type SettingsRecord = {
  apiKeyEnc: string | null;
  apiKeyLast4: string | null;
  apiKeyUpdatedAt: Date | null;
  model: string | null;
  analysisPrompt: string | null;
};

export type SettingsRepository = {
  get: (leaderId: string) => Promise<SettingsRecord | null>;
  saveApiKey: (leaderId: string, data: { enc: string; last4: string; at: Date }) => Promise<void>;
  clearApiKey: (leaderId: string) => Promise<void>;
  saveModel: (leaderId: string, model: string) => Promise<void>;
  // null = voltar ao prompt padrão.
  savePrompt: (leaderId: string, text: string | null) => Promise<void>;
};

type Source = 'leader' | 'installation' | 'none';

type Deps = {
  repo: SettingsRepository;
  // Chave de 32 bytes que cifra a chave de API no banco; sem ela, não dá para guardar chave nenhuma.
  key: Buffer | null;
  validateKey: (apiKey: string) => Promise<KeyCheck>;
  // Padrão da instalação (arquivo de ambiente): reserva quando a líder não configurou.
  installation: () => { apiKey?: string; model?: string };
  loadDefaultPrompt: () => Promise<string>;
  now?: () => Date;
};

export const makeSettingsService = ({
  repo,
  key,
  validateKey,
  installation,
  loadDefaultPrompt,
  now = () => new Date(),
}: Deps) => {
  // Chave da líder já decifrada; se não decifra (chave de cifra trocada), vale como não cadastrada.
  const leaderApiKey = (record: SettingsRecord | null) =>
    record?.apiKeyEnc && key ? decrypt(record.apiKeyEnc, key) : null;

  const resolve = async (leaderId: string) => {
    const record = await repo.get(leaderId);
    const fallback = installation();
    const ownKey = leaderApiKey(record);
    const apiKey = ownKey ?? fallback.apiKey ?? null;
    const model = record?.model ?? fallback.model ?? null;
    return {
      record,
      apiKey,
      model,
      apiKeySource: (ownKey ? 'leader' : fallback.apiKey ? 'installation' : 'none') as Source,
      modelSource: (record?.model ? 'leader' : fallback.model ? 'installation' : 'none') as Source,
    };
  };

  return {
    async get(user: CurrentUser) {
      const current = await resolve(user.leaderId);
      const prompt = current.record?.analysisPrompt ?? (await loadDefaultPrompt());
      return {
        apiKey: {
          configured: current.apiKeySource !== 'none',
          source: current.apiKeySource,
          // Só os 4 últimos caracteres da chave da líder: a chave inteira nunca sai do servidor.
          last4: current.apiKeySource === 'leader' ? current.record?.apiKeyLast4 : null,
          updatedAt:
            current.apiKeySource === 'leader'
              ? (current.record?.apiKeyUpdatedAt?.toISOString() ?? null)
              : null,
        },
        model: {
          value: current.model,
          source: current.modelSource,
          options: AI_MODELS,
        },
        prompt: {
          text: prompt,
          isCustom: Boolean(current.record?.analysisPrompt),
          minChars: PROMPT_MIN_CHARS,
          maxChars: PROMPT_MAX_CHARS,
        },
      };
    },

    async setApiKey(user: CurrentUser, raw: string) {
      if (!key) {
        throw new AppError(
          'Não dá para guardar a chave com segurança: falta SESSION_ENCRYPTION_KEY no .env do servidor.',
          503,
          'ENCRYPTION_KEY_MISSING',
        );
      }
      const apiKey = raw.trim();
      if (
        apiKey.length < API_KEY_MIN_CHARS ||
        apiKey.length > API_KEY_MAX_CHARS ||
        /\s/.test(apiKey)
      ) {
        throw new AppError(
          'Esta chave não parece completa. Copie a chave inteira, sem espaços.',
          422,
          'API_KEY_INVALID_FORMAT',
        );
      }

      const check = await validateKey(apiKey);
      if (check === 'rejected') {
        throw new AppError(
          'Esta chave não foi aceita pela Anthropic. Confira se copiou inteira.',
          422,
          'API_KEY_REJECTED',
        );
      }
      if (check === 'unreachable') {
        throw new AppError(
          'Não conseguimos falar com a Anthropic agora. Tente de novo.',
          503,
          'ANTHROPIC_UNREACHABLE',
        );
      }

      await repo.saveApiKey(user.leaderId, {
        enc: encrypt(apiKey, key),
        last4: apiKey.slice(-4),
        at: now(),
      });
    },

    async clearApiKey(user: CurrentUser) {
      await repo.clearApiKey(user.leaderId);
    },

    async setModel(user: CurrentUser, model: string) {
      if (!isKnownModel(model)) {
        throw new AppError('Escolha um dos modelos da lista.', 422, 'MODEL_UNKNOWN');
      }
      await repo.saveModel(user.leaderId, model);
    },

    async setPrompt(user: CurrentUser, raw: string) {
      const text = raw.trim();
      if (text.length < PROMPT_MIN_CHARS) {
        throw new AppError(
          `O prompt precisa ter pelo menos ${PROMPT_MIN_CHARS} caracteres para a IA entender o que fazer.`,
          422,
          'PROMPT_TOO_SHORT',
        );
      }
      if (text.length > PROMPT_MAX_CHARS) {
        throw new AppError(
          `O prompt passa do limite de ${PROMPT_MAX_CHARS} caracteres.`,
          422,
          'PROMPT_TOO_LONG',
        );
      }
      // Texto igual ao padrão não é "personalizado": volta a acompanhar o padrão do Bonsai.
      const isDefault = text === (await loadDefaultPrompt()).trim();
      await repo.savePrompt(user.leaderId, isDefault ? null : text);
    },

    async resetPrompt(user: CurrentUser) {
      await repo.savePrompt(user.leaderId, null);
    },

    // Chave e modelo que a análise deve usar: da líder, senão da instalação, senão avisa o que falta.
    async resolveAiConfig(leaderId: string) {
      const { apiKey, model } = await resolve(leaderId);
      if (!apiKey) {
        throw new AiNotConfiguredError(
          'Falta a chave do Claude. Cadastre em Configurações para analisar.',
        );
      }
      if (!model) {
        throw new AiNotConfiguredError('Falta escolher o modelo. Escolha em Configurações.');
      }
      return { apiKey, model };
    },

    // Prompt que a análise deve usar: o da líder, senão o padrão.
    async resolvePrompt(leaderId: string) {
      const record = await repo.get(leaderId);
      return record?.analysisPrompt ?? (await loadDefaultPrompt());
    },
  };
};

export type SettingsService = ReturnType<typeof makeSettingsService>;
