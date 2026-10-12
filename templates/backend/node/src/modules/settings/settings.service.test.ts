import { describe, expect, it, vi } from 'vitest';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import { decrypt } from '../../shared/security/session-crypto.js';
import {
  makeSettingsService,
  PROMPT_MAX_CHARS,
  PROMPT_MIN_CHARS,
  type SettingsRecord,
  type SettingsRepository,
} from './settings.service.js';

const user = { leaderId: FIXED_LEADER_ID };
const KEY = Buffer.alloc(32, 9);
const API_KEY = 'sk-ant-api03-SEGREDO-COMPLETO-1234567890-abcd';
const DEFAULT_PROMPT = 'Prompt padrão do Bonsai. '.repeat(20);

// Repositório em memória: guarda o que o service gravaria no banco.
const makeRepo = (initial: Partial<SettingsRecord> = {}) => {
  let record: SettingsRecord | null = {
    apiKeyEnc: null,
    apiKeyLast4: null,
    apiKeyUpdatedAt: null,
    model: null,
    analysisPrompt: null,
    ...initial,
  };
  const repo: SettingsRepository = {
    get: vi.fn(async () => record),
    saveApiKey: vi.fn(async (_leaderId, data) => {
      record = {
        ...record!,
        apiKeyEnc: data.enc,
        apiKeyLast4: data.last4,
        apiKeyUpdatedAt: data.at,
      };
    }),
    clearApiKey: vi.fn(async () => {
      record = { ...record!, apiKeyEnc: null, apiKeyLast4: null, apiKeyUpdatedAt: null };
    }),
    saveModel: vi.fn(async (_leaderId, model) => {
      record = { ...record!, model };
    }),
    savePrompt: vi.fn(async (_leaderId, text) => {
      record = { ...record!, analysisPrompt: text };
    }),
  };
  return { repo, current: () => record! };
};

const setup = (
  options: {
    initial?: Partial<SettingsRecord>;
    check?: 'ok' | 'rejected' | 'unreachable';
    installation?: { apiKey?: string; model?: string };
    key?: Buffer | null;
  } = {},
) => {
  const { repo, current } = makeRepo(options.initial);
  const validateKey = vi.fn().mockResolvedValue(options.check ?? 'ok');
  const now = new Date('2026-10-12T15:00:00.000Z');
  const service = makeSettingsService({
    repo,
    key: options.key === undefined ? KEY : options.key,
    validateKey,
    installation: () => options.installation ?? {},
    loadDefaultPrompt: async () => DEFAULT_PROMPT,
    now: () => now,
  });
  return { service, repo, current, validateKey, now };
};

describe('settings service — chave de API', () => {
  it('guarda a chave cifrada e mostra só os 4 últimos caracteres', async () => {
    const { service, current, validateKey, now } = setup();

    await service.setApiKey(user, `  ${API_KEY}\n`);

    expect(validateKey).toHaveBeenCalledWith(API_KEY);
    expect(current().apiKeyEnc).not.toContain('SEGREDO');
    expect(decrypt(current().apiKeyEnc!, KEY)).toBe(API_KEY);
    const view = await service.get(user);
    expect(view.apiKey).toEqual({
      configured: true,
      source: 'leader',
      last4: 'abcd',
      updatedAt: now.toISOString(),
    });
    expect(JSON.stringify(view)).not.toContain('SEGREDO');
  });

  it('não grava quando a Anthropic recusa e mantém a chave anterior', async () => {
    const first = setup();
    await first.service.setApiKey(user, API_KEY);
    const before = first.current().apiKeyEnc;

    first.validateKey.mockResolvedValueOnce('rejected');
    await expect(first.service.setApiKey(user, `${API_KEY}-outra`)).rejects.toMatchObject({
      code: 'API_KEY_REJECTED',
    });
    expect(first.current().apiKeyEnc).toBe(before);
  });

  it('avisa quando não consegue falar com a Anthropic e não grava', async () => {
    const { service, repo } = setup({ check: 'unreachable' });

    await expect(service.setApiKey(user, API_KEY)).rejects.toMatchObject({
      code: 'ANTHROPIC_UNREACHABLE',
      statusCode: 503,
    });
    expect(repo.saveApiKey).not.toHaveBeenCalled();
  });

  it('recusa chave incompleta ou com espaços sem consultar a Anthropic', async () => {
    const { service, validateKey } = setup();

    for (const bad of ['', 'curta', 'sk-ant com espaço no meio da chave'])
      await expect(service.setApiKey(user, bad)).rejects.toMatchObject({
        code: 'API_KEY_INVALID_FORMAT',
      });
    expect(validateKey).not.toHaveBeenCalled();
  });

  it('não guarda chave sem a chave de cifra do servidor', async () => {
    const { service, repo } = setup({ key: null });

    await expect(service.setApiKey(user, API_KEY)).rejects.toMatchObject({
      code: 'ENCRYPTION_KEY_MISSING',
    });
    expect(repo.saveApiKey).not.toHaveBeenCalled();
  });

  it('remove a chave e volta para a da instalação, se houver', async () => {
    const { service } = setup({ installation: { apiKey: 'sk-ant-instalacao-0000000000' } });
    await service.setApiKey(user, API_KEY);
    expect((await service.get(user)).apiKey.source).toBe('leader');

    await service.clearApiKey(user);

    expect((await service.get(user)).apiKey).toEqual({
      configured: true,
      source: 'installation',
      last4: null,
      updatedAt: null,
    });
  });

  it('usa a chave da líder; sem nada configurado, diz o que falta', async () => {
    const { service } = setup({ installation: { model: 'claude-sonnet-5-5' } });
    await expect(service.resolveAiConfig(FIXED_LEADER_ID)).rejects.toMatchObject({
      code: 'AI_NOT_CONFIGURED',
      message: expect.stringContaining('chave'),
    });

    await service.setApiKey(user, API_KEY);
    expect(await service.resolveAiConfig(FIXED_LEADER_ID)).toEqual({
      apiKey: API_KEY,
      model: 'claude-sonnet-5-5',
    });
  });

  it('trata como não cadastrada uma chave que não decifra mais', async () => {
    const { service } = setup({ initial: { apiKeyEnc: 'v1.lixo.lixo.lixo', apiKeyLast4: 'xxxx' } });

    expect((await service.get(user)).apiKey.configured).toBe(false);
  });
});

describe('settings service — modelo', () => {
  it('aceita só modelos da lista e a escolha da líder vale mais que a da instalação', async () => {
    const { service } = setup({ installation: { model: 'claude-haiku-5-5' } });
    expect((await service.get(user)).model).toMatchObject({
      value: 'claude-haiku-5-5',
      source: 'installation',
    });

    await expect(service.setModel(user, 'modelo-inventado')).rejects.toMatchObject({
      code: 'MODEL_UNKNOWN',
    });
    await service.setModel(user, 'claude-opus-5-5');

    expect((await service.get(user)).model).toMatchObject({
      value: 'claude-opus-5-5',
      source: 'leader',
    });
  });
});

describe('settings service — prompt', () => {
  const custom = 'Seja breve e direto na análise. '.repeat(10);

  it('mostra o padrão até a líder personalizar e depois volta ao padrão', async () => {
    const { service } = setup();
    expect((await service.get(user)).prompt).toMatchObject({
      text: DEFAULT_PROMPT,
      isCustom: false,
    });

    await service.setPrompt(user, custom);
    expect((await service.get(user)).prompt).toMatchObject({
      text: custom.trim(),
      isCustom: true,
    });
    expect(await service.resolvePrompt(user.leaderId)).toBe(custom.trim());

    await service.resetPrompt(user);
    expect((await service.get(user)).prompt.isCustom).toBe(false);
    expect(await service.resolvePrompt(user.leaderId)).toBe(DEFAULT_PROMPT);
  });

  it('recusa prompt curto demais ou longo demais', async () => {
    const { service, repo } = setup();

    await expect(service.setPrompt(user, 'x'.repeat(PROMPT_MIN_CHARS - 1))).rejects.toMatchObject({
      code: 'PROMPT_TOO_SHORT',
    });
    await expect(service.setPrompt(user, 'x'.repeat(PROMPT_MAX_CHARS + 1))).rejects.toMatchObject({
      code: 'PROMPT_TOO_LONG',
    });
    expect(repo.savePrompt).not.toHaveBeenCalled();
  });

  it('não chama de personalizado um texto idêntico ao padrão', async () => {
    const { service, repo } = setup();

    await service.setPrompt(user, DEFAULT_PROMPT);

    expect(repo.savePrompt).toHaveBeenCalledWith(FIXED_LEADER_ID, null);
  });
});
