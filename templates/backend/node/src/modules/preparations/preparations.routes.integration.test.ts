import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { AiNotConfiguredError } from '../../shared/ai/ai-client.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { prisma } from '../../shared/database/prisma.js';
import { authed } from '../../test/auth.js';
import { newPersonBody } from '../../test/responsibilities.js';
import { resetDatabase } from '../../test/reset-database.js';
import { makeDefaultPreparationsService } from './preparations.routes.js';

const API = '/api/v1';

const output = {
  themes: [{ title: 'Proposta parada', detail: 'Voltou em dois encontros.' }],
  questions: ['O que te motiva hoje?', 'Onde posso apoiar?', 'Como vê sua carreira?'],
};

const setup = (outputs: unknown[], aiConfigured = true) => {
  const fake = makeFakeAiClient(outputs);
  const jobs: Array<() => Promise<void>> = [];
  const preparationsService = makeDefaultPreparationsService({
    getAiClient: () => {
      if (!aiConfigured) throw new AiNotConfiguredError();
      return fake.client;
    },
    schedule: (job) => {
      jobs.push(job);
    },
  });
  const app = createApp({ preparationsService });
  const runJobs = async () => {
    for (const job of jobs.splice(0)) await job();
  };
  return { app, fake, runJobs };
};

const createReport = async (app: ReturnType<typeof createApp>) => {
  const response = await authed(app)
    .post(`${API}/direct-reports`)
    .send(newPersonBody({ name: 'Marina Tavares', role: 'Designer', startedAt: '2025-01-20' }));
  return response.body.id as string;
};

describe('preparations', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve devolver nulo enquanto nunca houve roteiro', async () => {
    const { app } = setup([]);
    const reportId = await createReport(app);

    const response = await authed(app).get(`${API}/direct-reports/${reportId}/preparations/latest`);

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('deve gerar o roteiro de uma pessoa sem histórico e mostrá-lo como o último', async () => {
    const { app, fake, runJobs } = setup([output]);
    const reportId = await createReport(app);

    const started = await authed(app)
      .post(`${API}/direct-reports/${reportId}/preparations`)
      .send({});
    expect(started.status).toBe(202);
    expect(started.body.status).toBe('processing');
    await runJobs();

    const latest = await authed(app).get(`${API}/direct-reports/${reportId}/preparations/latest`);
    expect(latest.body).toMatchObject({
      id: started.body.id,
      status: 'completed',
      content: {
        has_history: false,
        open_agreements: [],
        map_gaps: [],
        questions: output.questions,
      },
    });
    expect(fake.calls[0]?.user).toContain('Nenhum encontro anterior revisado.');
  });

  it('deve incluir os combinados em aberto da pessoa', async () => {
    const { app, runJobs } = setup([output]);
    const reportId = await createReport(app);
    await authed(app)
      .post(`${API}/direct-reports/${reportId}/agreements`)
      .send({ description: 'Enviar a proposta', owner: 'report', dueDate: '2020-01-10' });

    await authed(app).post(`${API}/direct-reports/${reportId}/preparations`).send({});
    await runJobs();

    const latest = await authed(app).get(`${API}/direct-reports/${reportId}/preparations/latest`);
    expect(latest.body.content.open_agreements).toEqual([
      expect.objectContaining({
        description: 'Enviar a proposta',
        owner: 'report',
        due_date: '2020-01-10',
        is_overdue: true,
      }),
    ]);
  });

  it('deve mostrar a falha quando a IA não responde no formato', async () => {
    const { app, runJobs } = setup(['lixo', 'lixo']);
    const reportId = await createReport(app);

    await authed(app).post(`${API}/direct-reports/${reportId}/preparations`).send({});
    await runJobs();

    const latest = await authed(app).get(`${API}/direct-reports/${reportId}/preparations/latest`);
    expect(latest.body.status).toBe('failed');
    expect(latest.body.errorMessage).toContain('formato esperado');
    expect(latest.body.content).toBeNull();
  });

  it('deve responder 503 quando a IA não está configurada', async () => {
    const { app } = setup([], false);
    const reportId = await createReport(app);

    const response = await authed(app)
      .post(`${API}/direct-reports/${reportId}/preparations`)
      .send({});

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('AI_NOT_CONFIGURED');
  });

  it('deve esconder o roteiro quando a pessoa é excluída', async () => {
    const { app, runJobs } = setup([output]);
    const reportId = await createReport(app);
    await authed(app).post(`${API}/direct-reports/${reportId}/preparations`).send({});
    await runJobs();

    await authed(app).delete(`${API}/direct-reports/${reportId}`);

    const latest = await authed(app).get(`${API}/direct-reports/${reportId}/preparations/latest`);
    expect(latest.status).toBe(404);
  });

  it('deve recusar id que não é UUID', async () => {
    const { app } = setup([]);

    const response = await authed(app).get(`${API}/direct-reports/abc/preparations/latest`);

    expect(response.status).toBe(400);
  });
});
