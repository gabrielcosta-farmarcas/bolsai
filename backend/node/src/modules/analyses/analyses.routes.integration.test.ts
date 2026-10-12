import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { AiNotConfiguredError } from '../../shared/ai/ai-client.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { prisma } from '../../shared/database/prisma.js';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import { authed } from '../../test/auth.js';
import { newPersonBody } from '../../test/responsibilities.js';
import { resetDatabase } from '../../test/reset-database.js';
import type { AnalysisOutput } from './analysis.schema.js';
import { makeDefaultAnalysesService } from './analyses.routes.js';

const output = (summary: string): AnalysisOutput => ({
  summary,
  themes: [{ title: 'Projeto novo', detail: 'Quer participar do desenho.' }],
  agreements: [
    {
      description: 'Enviar a proposta de escopo',
      owner: 'report',
      due_date: null,
      evidence_excerpt: 'Eu te mando a proposta.',
    },
  ],
  previous_agreements: [],
  development_signals: [
    { responsibility_ref: 'R1', observation: 'Expôs ideias com clareza.', kind: 'growth' },
  ],
  attention_points: [],
  next_questions: ['O que te motiva hoje?'],
  private_leader_notes: 'NOTA-PRIVADA-DO-LIDER',
  leader_feedback: sampleLeaderFeedback,
});

const setup = (outputs: unknown[], aiConfigured = true) => {
  const fake = makeFakeAiClient(outputs);
  const jobs: Array<() => Promise<void>> = [];
  const analysesService = makeDefaultAnalysesService({
    getAiClient: () => {
      if (!aiConfigured) throw new AiNotConfiguredError();
      return fake.client;
    },
    schedule: (job) => {
      jobs.push(job);
    },
  });
  const app = createApp({ analysesService });
  const runJobs = async () => {
    for (const job of jobs.splice(0)) await job();
  };
  return { app, fake, runJobs };
};

const createReport = async (app: ReturnType<typeof createApp>) => {
  const response = await authed(app)
    .post('/api/v1/direct-reports')
    .send(newPersonBody({ name: 'Marina Tavares', role: 'Designer', startedAt: '2025-01-20' }));
  return response.body.id as string;
};

const createSession = async (
  app: ReturnType<typeof createApp>,
  reportId: string,
  heldOn: string,
  transcript = 'Marina: Eu te mando a proposta.',
) => {
  const response = await authed(app)
    .post(`/api/v1/direct-reports/${reportId}/sessions`)
    .send({ heldOn, transcript });
  return response.body.id as string;
};

describe('sessions and analyses', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve mandar à IA todas as responsabilidades e guardar cada observação com o id da responsabilidade', async () => {
    const withSignals = {
      ...output('Com sinais.'),
      development_signals: [
        { responsibility_ref: 'R2', observation: 'Atendeu bem.', kind: 'growth' },
        { responsibility_ref: 'FORA', observation: 'Falou de carreira.', kind: 'neutral' },
      ],
    };
    const { app, fake, runJobs } = setup([withSignals]);
    const reportId = await createReport(app);
    const sessionId = await createSession(app, reportId, '2026-10-01');
    const list = (await authed(app).get(`/api/v1/direct-reports/${reportId}/responsibilities`))
      .body as Array<{
      id: string;
      text: string;
    }>;

    const started = await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({});
    await runJobs();

    const sent = fake.calls[0]?.user ?? '';
    list.forEach((item, index) => expect(sent).toContain(`R${index + 1}: ${item.text}`));
    const detail = await authed(app).get(`/api/v1/analyses/${started.body.id}`);
    expect(detail.body.rawJson.development_signals).toEqual([
      { responsibility_id: list[1]?.id, observation: 'Atendeu bem.', kind: 'growth' },
      { responsibility_id: null, observation: 'Falou de carreira.', kind: 'neutral' },
    ]);
    expect(JSON.stringify(detail.body.rawJson)).not.toContain('R2');
  });

  it('deve recusar revisão que aponta para responsabilidade de outra pessoa', async () => {
    const { app, runJobs } = setup([output('Primeira.')]);
    const reportId = await createReport(app);
    const other = await createReport(app);
    const otherId = (
      (await authed(app).get(`/api/v1/direct-reports/${other}/responsibilities`)).body as Array<{
        id: string;
      }>
    )[0]?.id;
    const sessionId = await createSession(app, reportId, '2026-10-01');
    const analysisId = (await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({}))
      .body.id;
    await runJobs();
    const raw = (await authed(app).get(`/api/v1/analyses/${analysisId}`)).body.rawJson;

    const foreign = await authed(app)
      .put(`/api/v1/sessions/${sessionId}/review`)
      .send({
        analysisId,
        reviewedJson: {
          ...raw,
          development_signals: [{ responsibility_id: otherId, observation: 'x', kind: 'neutral' }],
        },
      });
    const ok = await authed(app)
      .put(`/api/v1/sessions/${sessionId}/review`)
      .send({ analysisId, reviewedJson: raw });

    expect(foreign.status).toBe(422);
    expect(foreign.body.error.code).toBe('INVALID_RESPONSIBILITY_REFERENCE');
    expect(ok.status).toBe(200);
  });

  it('deve criar sessão por texto e por arquivo .vtt, e listar sem a transcrição', async () => {
    const { app } = setup([]);
    const reportId = await createReport(app);

    const byText = await authed(app)
      .post(`/api/v1/direct-reports/${reportId}/sessions`)
      .send({ heldOn: '2026-10-01', transcript: 'Marina: Oi!' });
    const vtt = 'WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\n<v Marina>Tenho uma ideia.</v>\n';
    const byFile = await authed(app)
      .post(`/api/v1/direct-reports/${reportId}/sessions`)
      .field('heldOn', '2026-10-22')
      .attach('file', Buffer.from(vtt), 'reuniao.vtt');

    expect(byText.status).toBe(201);
    expect(byText.body).toMatchObject({ status: 'draft', heldOn: '2026-10-01' });
    expect(byFile.status).toBe(201);
    expect(byFile.body.transcript).toBe('Marina: Tenho uma ideia.');

    const list = await authed(app).get(`/api/v1/direct-reports/${reportId}/sessions`);
    expect(list.body.map((s: { heldOn: string }) => s.heldOn)).toEqual([
      '2026-10-22',
      '2026-10-01',
    ]);
    expect(list.body[0]).not.toHaveProperty('transcript');
  });

  it('deve responder 400 para dados inválidos, 422 para transcrição vazia e 404 sem liderado', async () => {
    const { app } = setup([]);
    const reportId = await createReport(app);
    const url = `/api/v1/direct-reports/${reportId}/sessions`;

    expect(
      (await authed(app).post(url).send({ heldOn: '01/10/2026', transcript: 'x' })).status,
    ).toBe(400);
    expect((await authed(app).post(url).send({ heldOn: '2026-10-01' })).status).toBe(400);
    const empty = await authed(app).post(url).send({ heldOn: '2026-10-01', transcript: '  ' });
    expect(empty.status).toBe(422);
    expect(empty.body.error.code).toBe('EMPTY_TRANSCRIPT');
    const missing = await authed(app)
      .post('/api/v1/direct-reports/018f0000-0000-7000-8000-0000000000ff/sessions')
      .send({ heldOn: '2026-10-01', transcript: 'x' });
    expect(missing.status).toBe(404);
  });

  it('deve analisar em segundo plano, deixar a sessão analisada e salvar a revisão como final', async () => {
    const { app, runJobs } = setup([output('Primeira análise.')]);
    const reportId = await createReport(app);
    const sessionId = await createSession(app, reportId, '2026-10-01');

    const started = await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({});
    expect(started.status).toBe(202);
    expect(started.body).toMatchObject({ status: 'processing' });

    await runJobs();

    const done = await authed(app).get(`/api/v1/analyses/${started.body.id}`);
    expect(done.body.status).toBe('completed');
    expect(done.body.rawJson.summary).toBe('Primeira análise.');
    expect((await authed(app).get(`/api/v1/sessions/${sessionId}`)).body.status).toBe('analysed');

    const edited = { ...done.body.rawJson, summary: 'Resumo editado pelo líder.' };
    const saved = await authed(app)
      .put(`/api/v1/sessions/${sessionId}/review`)
      .send({ analysisId: started.body.id, reviewedJson: edited });

    expect(saved.status).toBe(200);
    expect(saved.body.isFinal).toBe(true);
    expect((await authed(app).get(`/api/v1/sessions/${sessionId}`)).body.status).toBe('reviewed');
    const detail = await authed(app).get(`/api/v1/analyses/${started.body.id}`);
    expect(detail.body.reviewedJson.summary).toBe('Resumo editado pelo líder.');
    expect(detail.body.rawJson.summary).toBe('Primeira análise.');
  });

  it('deve manter a versão final ao reprocessar e trocá-la só quando a nova revisão for salva', async () => {
    const { app, runJobs } = setup([output('Análise A.'), output('Análise B.')]);
    const reportId = await createReport(app);
    const sessionId = await createSession(app, reportId, '2026-10-01');
    const url = `/api/v1/sessions/${sessionId}`;

    const first = (await authed(app).post(`${url}/analyses`).send({})).body.id as string;
    await runJobs();
    await authed(app)
      .put(`${url}/review`)
      .send({
        analysisId: first,
        reviewedJson: (await authed(app).get(`/api/v1/analyses/${first}`)).body.rawJson,
      });

    const second = (await authed(app).post(`${url}/analyses`).send({})).body.id as string;
    await runJobs();

    let list = (await authed(app).get(`${url}/analyses`)).body as Array<{
      id: string;
      isFinal: boolean;
    }>;
    expect(list.filter((a) => a.isFinal).map((a) => a.id)).toEqual([first]);
    expect((await authed(app).get(url)).body.status).toBe('reviewed');

    await authed(app)
      .put(`${url}/review`)
      .send({
        analysisId: second,
        reviewedJson: (await authed(app).get(`/api/v1/analyses/${second}`)).body.rawJson,
      });

    list = (await authed(app).get(`${url}/analyses`)).body;
    expect(list.filter((a) => a.isFinal).map((a) => a.id)).toEqual([second]);
  });

  it('deve usar o resumo final do encontro anterior como contexto da análise seguinte', async () => {
    const { app, fake, runJobs } = setup([
      output('Resumo do primeiro encontro.'),
      output('Segundo.'),
    ]);
    const reportId = await createReport(app);
    const firstSession = await createSession(app, reportId, '2026-09-10');
    const firstAnalysis = (
      await authed(app).post(`/api/v1/sessions/${firstSession}/analyses`).send({})
    ).body.id;
    await runJobs();
    await authed(app)
      .put(`/api/v1/sessions/${firstSession}/review`)
      .send({
        analysisId: firstAnalysis,
        reviewedJson: (await authed(app).get(`/api/v1/analyses/${firstAnalysis}`)).body.rawJson,
      });

    const secondSession = await createSession(app, reportId, '2026-10-01');
    await authed(app).post(`/api/v1/sessions/${secondSession}/analyses`).send({});
    await runJobs();

    expect(fake.calls[1]?.user).toContain('Resumo do primeiro encontro.');
  });

  it('deve registrar a falha quando a IA devolve saída inválida duas vezes', async () => {
    const { app, runJobs } = setup(['não é json', 'continua sem ser json']);
    const reportId = await createReport(app);
    const sessionId = await createSession(app, reportId, '2026-10-01');

    const started = await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({});
    await runJobs();

    const detail = await authed(app).get(`/api/v1/analyses/${started.body.id}`);
    expect(detail.body.status).toBe('failed');
    expect(detail.body.errorMessage).toContain('formato esperado');
    expect((await authed(app).get(`/api/v1/sessions/${sessionId}`)).body.status).toBe('draft');
  });

  it('deve responder 503 quando a IA não está configurada', async () => {
    const unconfigured = setup([], false);
    const reportId = await createReport(unconfigured.app);
    const sessionId = await createSession(unconfigured.app, reportId, '2026-10-01');

    const notConfigured = await authed(unconfigured.app)
      .post(`/api/v1/sessions/${sessionId}/analyses`)
      .send({});
    expect(notConfigured.status).toBe(503);
    expect(notConfigured.body.error.code).toBe('AI_NOT_CONFIGURED');
  });

  it('deve recusar revisão fora do formato', async () => {
    const { app, runJobs } = setup([output('A.')]);
    const reportId = await createReport(app);
    const sessionId = await createSession(app, reportId, '2026-10-01');
    const analysisId = (await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({}))
      .body.id;
    await runJobs();

    const invalid = await authed(app)
      .put(`/api/v1/sessions/${sessionId}/review`)
      .send({ analysisId, reviewedJson: { summary: 'só isso' } });
    expect(invalid.status).toBe(400);
  });

  it('deve esconder sessões e análises de um liderado excluído', async () => {
    const { app, runJobs } = setup([output('A.')]);
    const reportId = await createReport(app);
    const sessionId = await createSession(app, reportId, '2026-10-01');
    const analysisId = (await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({}))
      .body.id;
    await runJobs();

    await authed(app).delete(`/api/v1/direct-reports/${reportId}`);

    expect((await authed(app).get(`/api/v1/sessions/${sessionId}`)).status).toBe(404);
    expect((await authed(app).get(`/api/v1/sessions/${sessionId}/analyses`)).status).toBe(404);
    expect((await authed(app).get(`/api/v1/analyses/${analysisId}`)).status).toBe(404);
    expect((await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({})).status).toBe(
      404,
    );
  });
});
