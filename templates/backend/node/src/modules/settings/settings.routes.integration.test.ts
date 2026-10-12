import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { prisma } from '../../shared/database/prisma.js';
import { logger } from '../../shared/logger.js';
import { loadKey } from '../../shared/security/session-crypto.js';
import { authed, createTestSession } from '../../test/auth.js';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import { resetDatabase } from '../../test/reset-database.js';
import { newPersonBody } from '../../test/responsibilities.js';
import { makeDefaultAnalysesService } from '../analyses/analyses.routes.js';
import type { AnalysisOutput } from '../analyses/analysis.schema.js';
import { settingsRepository } from './settings.repository.js';
import { makeSettingsService } from './settings.service.js';

const API_KEY = 'sk-ant-api03-SEGREDO-UNICO-1234567890-wxyz';
const CUSTOM_PROMPT = 'PROMPT-PERSONALIZADO-UNICO. Seja direto e objetivo na análise. '.repeat(5);

const output: AnalysisOutput = {
  summary: 'Resumo.',
  themes: [],
  agreements: [],
  previous_agreements: [],
  development_signals: [],
  attention_points: [],
  next_questions: [],
  private_leader_notes: '',
  leader_feedback: sampleLeaderFeedback,
};

// Texto do que seria registrado, sem os objetos internos de requisição/resposta (o servidor só
// registra deles método, endereço e status) e sem quebrar em referências circulares.
const safeStringify = (value: unknown) => {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (key, item: unknown) => {
    if (key === 'req' || key === 'res') return undefined;
    if (typeof item === 'object' && item !== null) {
      if (seen.has(item)) return undefined;
      seen.add(item);
    }
    return item;
  });
};

// Serviço de verdade (banco de teste), mas sem chamar a Anthropic: a chave "SEGREDO" vale, outras não.
const makeService = (installation: { apiKey?: string; model?: string } = {}) =>
  makeSettingsService({
    repo: settingsRepository,
    key: loadKey(env.SESSION_ENCRYPTION_KEY ?? ''),
    validateKey: async (apiKey) => (apiKey.includes('SEGREDO') ? 'ok' : 'rejected'),
    installation: () => installation,
    loadDefaultPrompt: async () => 'Prompt padrão do Bonsai para teste. '.repeat(10),
  });

describe('configurações da líder', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve mostrar o padrão quando nada foi configurado', async () => {
    const app = createApp({ settingsService: makeService() });

    const result = await authed(app).get('/api/v1/settings');

    expect(result.status).toBe(200);
    expect(result.body.prompt.isCustom).toBe(false);
    expect(result.body.model.options.length).toBeGreaterThan(0);
    expect(result.body.apiKey).toMatchObject({ configured: false, source: 'none' });
  });

  it('deve trocar o modelo e personalizar e restaurar o prompt', async () => {
    const app = createApp({ settingsService: makeService() });

    const model = await authed(app)
      .put('/api/v1/settings/model')
      .send({ model: 'claude-opus-5-5' });
    expect(model.body.model).toMatchObject({ value: 'claude-opus-5-5', source: 'leader' });
    const unknown = await authed(app).put('/api/v1/settings/model').send({ model: 'qualquer' });
    expect(unknown.status).toBe(422);

    const custom = await authed(app).put('/api/v1/settings/prompt').send({ text: CUSTOM_PROMPT });
    expect(custom.body.prompt).toMatchObject({ isCustom: true, text: CUSTOM_PROMPT.trim() });
    const short = await authed(app).put('/api/v1/settings/prompt').send({ text: 'curto' });
    expect(short.status).toBe(422);
    expect(short.body.error.code).toBe('PROMPT_TOO_SHORT');

    const reset = await authed(app).delete('/api/v1/settings/prompt');
    expect(reset.body.prompt.isCustom).toBe(false);
  });

  it('deve guardar a chave cifrada e nunca devolvê-la, nem nos logs', async () => {
    const logged: string[] = [];
    const spies = (['info', 'warn', 'error', 'debug'] as const).map((level) =>
      vi.spyOn(logger, level).mockImplementation(((...args: unknown[]) => {
        logged.push(safeStringify(args));
      }) as never),
    );
    const app = createApp({ settingsService: makeService() });

    const saved = await authed(app).put('/api/v1/settings/api-key').send({ apiKey: API_KEY });
    const read = await authed(app).get('/api/v1/settings');
    const rejected = await authed(app)
      .put('/api/v1/settings/api-key')
      .send({ apiKey: 'sk-ant-chave-que-sera-recusada-000000' });
    spies.forEach((spy) => spy.mockRestore());

    expect(saved.status).toBe(200);
    expect(saved.body.apiKey).toMatchObject({ configured: true, source: 'leader', last4: 'wxyz' });
    expect(rejected.status).toBe(422);
    expect(rejected.body.error.code).toBe('API_KEY_REJECTED');
    // A chave recusada não derrubou a anterior.
    expect(read.body.apiKey.configured).toBe(true);

    const row = await prisma.leaderSettings.findFirstOrThrow();
    expect(row.apiKeyEnc).not.toContain('SEGREDO');
    for (const text of [saved.body, read.body, rejected.body, logged].map((item) =>
      JSON.stringify(item),
    )) {
      expect(text).not.toContain('SEGREDO-UNICO');
    }

    const removed = await authed(app).delete('/api/v1/settings/api-key');
    expect(removed.body.apiKey).toMatchObject({ configured: false });
  });

  it('deve usar o modelo e o prompt da líder na análise', async () => {
    const service = makeService({ apiKey: 'sk-ant-instalacao-0000000000' });
    const fake = makeFakeAiClient([output]);
    const modelsUsed: string[] = [];
    const jobs: Array<() => Promise<void>> = [];
    const analysesService = makeDefaultAnalysesService({
      getAiClient: async (leaderId) => {
        modelsUsed.push((await service.resolveAiConfig(leaderId)).model);
        return fake.client;
      },
      prompts: { load: (leaderId) => service.resolvePrompt(leaderId) },
      schedule: (job) => {
        jobs.push(job);
      },
    });
    const app = createApp({ settingsService: service, analysesService });

    await authed(app).put('/api/v1/settings/model').send({ model: 'claude-haiku-5-5' });
    await authed(app).put('/api/v1/settings/prompt').send({ text: CUSTOM_PROMPT });
    const report = await authed(app)
      .post('/api/v1/direct-reports')
      .send(newPersonBody({ name: 'Ana Moura', role: 'Analista', startedAt: '2025-01-20' }));
    const session = await authed(app)
      .post(`/api/v1/direct-reports/${report.body.id}/sessions`)
      .send({ heldOn: '2026-10-01', transcript: 'Ana: conversa.' });

    await authed(app).post(`/api/v1/sessions/${session.body.id}/analyses`).send({});
    for (const job of jobs.splice(0)) await job();

    expect(modelsUsed).toEqual(['claude-haiku-5-5']);
    expect(fake.calls[0]?.system).toContain('PROMPT-PERSONALIZADO-UNICO');

    await authed(app).delete('/api/v1/settings/prompt');
    expect(await service.resolvePrompt((await prisma.leader.findFirstOrThrow()).id)).toContain(
      'Prompt padrão do Bonsai',
    );
  });

  it('deve isolar as configurações entre líderes', async () => {
    const app = createApp({ settingsService: makeService() });
    const leaderB = await prisma.leader.create({
      data: { name: 'Bia', keycloakSubject: 'leader-b' },
    });
    const cookieB = await createTestSession({ subject: 'leader-b', leaderId: leaderB.id });

    await authed(app).put('/api/v1/settings/api-key').send({ apiKey: API_KEY });
    await authed(app).put('/api/v1/settings/model').send({ model: 'claude-opus-5-5' });
    await authed(app).put('/api/v1/settings/prompt').send({ text: CUSTOM_PROMPT });

    const other = await authed(app, cookieB).get('/api/v1/settings');

    expect(other.body.apiKey.configured).toBe(false);
    expect(other.body.model.value).toBeNull();
    expect(other.body.prompt.isCustom).toBe(false);
  });
});
