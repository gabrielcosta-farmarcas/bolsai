import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { prisma } from '../../shared/database/prisma.js';
import { authed } from '../../test/auth.js';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import { resetDatabase } from '../../test/reset-database.js';
import { newPersonBody } from '../../test/responsibilities.js';
import { makeDefaultAnalysesService } from '../analyses/analyses.routes.js';
import type { AnalysisOutput } from '../analyses/analysis.schema.js';

const output: AnalysisOutput = {
  summary: 'Resumo do encontro.',
  themes: [{ title: 'Prioridades', detail: 'Foco no trimestre.' }],
  agreements: [
    {
      description: 'Enviar o plano',
      owner: 'report',
      due_date: '2026-10-20',
      evidence_excerpt: 'Trecho de combinado',
    },
  ],
  previous_agreements: [],
  development_signals: [],
  attention_points: [],
  next_questions: [],
  private_leader_notes: 'NOTA-PRIVADA-UNICA',
  leader_feedback: { ...sampleLeaderFeedback, overall_note: 'FEEDBACK-PRIVADO-UNICO' },
};

const setup = () => {
  const fake = makeFakeAiClient([output]);
  const jobs: Array<() => Promise<void>> = [];
  const analysesService = makeDefaultAnalysesService({
    getAiClient: () => fake.client,
    schedule: (job) => {
      jobs.push(job);
    },
  });
  const app = createApp({ analysesService });
  const runJobs = async () => {
    for (const job of jobs.splice(0)) await job();
  };
  return { app, runJobs };
};

describe('resumo para copiar', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve entregar só resumo, temas e combinados e registrar a exportação', async () => {
    const { app, runJobs } = setup();
    const report = await authed(app)
      .post('/api/v1/direct-reports')
      .send(newPersonBody({ name: 'Ana Moura', role: 'Analista', startedAt: '2025-01-20' }));
    const session = await authed(app)
      .post(`/api/v1/direct-reports/${report.body.id}/sessions`)
      .send({ heldOn: '2026-10-01', transcript: 'TRANSCRICAO-UNICA do encontro.' });
    const sessionId = session.body.id as string;

    const early = await authed(app).post(`/api/v1/sessions/${sessionId}/summary`).send({});
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('SESSION_NOT_REVIEWED');

    const started = await authed(app).post(`/api/v1/sessions/${sessionId}/analyses`).send({});
    await runJobs();
    const analysis = await authed(app).get(`/api/v1/analyses/${started.body.id}`);
    await authed(app)
      .put(`/api/v1/sessions/${sessionId}/review`)
      .send({
        analysisId: started.body.id,
        reviewedJson: {
          ...analysis.body.rawJson,
          private_leader_notes: 'NOTA-PRIVADA-UNICA',
        },
      });

    const result = await authed(app).post(`/api/v1/sessions/${sessionId}/summary`).send({});

    expect(result.status).toBe(200);
    expect(result.body.markdown).toContain('Ana Moura');
    expect(result.body.markdown).toContain('Enviar o plano (Liderado, prazo 20/10/2026)');
    for (const secret of ['TRANSCRICAO-UNICA', 'NOTA-PRIVADA-UNICA', 'FEEDBACK-PRIVADO-UNICO']) {
      expect(JSON.stringify(result.body)).not.toContain(secret);
    }
    const stored = await authed(app).get(`/api/v1/sessions/${sessionId}`);
    expect(stored.body.summaryExportedAt).not.toBeNull();
  });

  it('deve responder 404 para o encontro de outra pessoa inexistente', async () => {
    const { app } = setup();
    const result = await authed(app)
      .post('/api/v1/sessions/0198a000-0000-7000-8000-0000000000aa/summary')
      .send({});
    expect(result.status).toBe(404);
  });
});
