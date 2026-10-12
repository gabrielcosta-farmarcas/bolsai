import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { prisma } from '../../shared/database/prisma.js';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import { authed } from '../../test/auth.js';
import { newPersonBody } from '../../test/responsibilities.js';
import { resetDatabase } from '../../test/reset-database.js';
import { makeDefaultAnalysesService } from '../analyses/analyses.routes.js';
import type { AnalysisOutput } from '../analyses/analysis.schema.js';

const agreement = (description: string, dueDate: string | null = null) => ({
  description,
  owner: 'report' as const,
  due_date: dueDate,
  evidence_excerpt: `Trecho de ${description}`,
});

const output = (
  agreements: AnalysisOutput['agreements'],
  extra: Partial<AnalysisOutput> = {},
): AnalysisOutput => ({
  summary: 'Resumo do encontro.',
  themes: [{ title: 'Tema', detail: 'Detalhe' }],
  agreements,
  previous_agreements: [],
  development_signals: [
    { responsibility_ref: 'R1', observation: 'Expôs ideias com clareza.', kind: 'growth' },
  ],
  attention_points: [],
  next_questions: ['O que te motiva hoje?'],
  private_leader_notes: 'NOTA-PRIVADA',
  leader_feedback: {
    ...sampleLeaderFeedback,
    overall_note: 'FEEDBACK-PRIVADO-DO-LIDER',
  },
  ...extra,
});

const setup = (outputs: unknown[]) => {
  const fake = makeFakeAiClient(outputs);
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
  return { app, fake, runJobs };
};

type App = ReturnType<typeof createApp>;

const createReport = async (app: App) =>
  (
    await authed(app)
      .post('/api/v1/direct-reports')
      .send(newPersonBody({ name: 'Ana Moura', role: 'Analista', startedAt: '2025-01-20' }))
  ).body.id as string;

const createSession = async (app: App, reportId: string, heldOn: string) =>
  (
    await authed(app)
      .post(`/api/v1/direct-reports/${reportId}/sessions`)
      .send({ heldOn, transcript: 'Ana: conversa de teste.' })
  ).body.id as string;

const analyse = async (ctx: ReturnType<typeof setup>, sessionId: string) => {
  const started = await authed(ctx.app).post(`/api/v1/sessions/${sessionId}/analyses`).send({});
  await ctx.runJobs();
  return started.body.id as string;
};

const review = async (app: App, sessionId: string, analysisId: string, reviewedJson: unknown) =>
  authed(app).put(`/api/v1/sessions/${sessionId}/review`).send({ analysisId, reviewedJson });

const listSession = async (app: App, sessionId: string) =>
  (await authed(app).get(`/api/v1/sessions/${sessionId}/agreements`)).body as Array<{
    id: string;
    description: string;
    status: string;
    origin: string;
    isConfirmed: boolean;
    dueDate: string | null;
  }>;

describe('agreements', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve salvar sozinho os combinados da IA ao concluir a análise, abertos e não confirmados', async () => {
    const ctx = setup([
      output([agreement('Enviar a proposta', '2026-10-02'), agreement('Marcar o curso')]),
    ]);
    const reportId = await createReport(ctx.app);
    const sessionId = await createSession(ctx.app, reportId, '2026-10-01');

    expect(await listSession(ctx.app, sessionId)).toHaveLength(0);
    await analyse(ctx, sessionId);

    const saved = await listSession(ctx.app, sessionId);
    expect(saved.map((item) => item.description).sort()).toEqual([
      'Enviar a proposta',
      'Marcar o curso',
    ]);
    expect(
      saved.every((item) => item.status === 'open' && item.origin === 'ai' && !item.isConfirmed),
    ).toBe(true);

    const byReport = await authed(ctx.app).get(`/api/v1/direct-reports/${reportId}/agreements`);
    expect(byReport.body).toHaveLength(2);
  });

  it('deve descartar combinados repetidos: na própria análise e de um encontro anterior ainda em aberto', async () => {
    const ctx = setup([
      output([
        agreement('Testar o Impulso corrigido na próxima agenda do 1:1.'),
        agreement('Testar o Impulso corrigido, com a próxima agenda já caminhando.'),
        agreement('Enviar o plano de carreira revisado ao gestor'),
      ]),
      output([
        agreement('Testar o Impulso corrigido antes da próxima agenda.'),
        agreement('Marcar o curso de liderança para o próximo trimestre'),
      ]),
    ]);
    const reportId = await createReport(ctx.app);
    const first = await createSession(ctx.app, reportId, '2026-10-01');
    await analyse(ctx, first);

    expect((await listSession(ctx.app, first)).map((item) => item.description).sort()).toEqual([
      'Enviar o plano de carreira revisado ao gestor',
      'Testar o Impulso corrigido na próxima agenda do 1:1.',
    ]);

    const second = await createSession(ctx.app, reportId, '2026-10-08');
    await analyse(ctx, second);

    expect((await listSession(ctx.app, second)).map((item) => item.description)).toEqual([
      'Marcar o curso de liderança para o próximo trimestre',
    ]);
  });

  it('deve confirmar ao editar e, ao reanalisar, trocar só os da IA que ninguém tocou', async () => {
    const ctx = setup([
      output([agreement('Enviar a proposta ao cliente'), agreement('Marcar o curso de liderança')]),
      output([agreement('Revisar o contrato com o jurídico')]),
    ]);
    const reportId = await createReport(ctx.app);
    const sessionId = await createSession(ctx.app, reportId, '2026-10-01');
    await analyse(ctx, sessionId);

    const [first] = (await listSession(ctx.app, sessionId)).filter(
      (item) => item.description === 'Enviar a proposta ao cliente',
    );
    const edited = await authed(ctx.app)
      .patch(`/api/v1/agreements/${first?.id}`)
      .send({ description: 'Enviar a proposta ao cliente (ajustada)', dueDate: '2026-10-20' });
    expect(edited.body).toMatchObject({ isConfirmed: true, dueDate: '2026-10-20' });
    const manual = await authed(ctx.app)
      .post(`/api/v1/direct-reports/${reportId}/agreements`)
      .send({ description: 'Feito à mão', owner: 'leader', sessionId });
    expect(manual.status).toBe(201);
    expect(manual.body).toMatchObject({ origin: 'leader', isConfirmed: true });

    await analyse(ctx, sessionId);

    const descriptions = (await listSession(ctx.app, sessionId))
      .map((item) => item.description)
      .sort();
    expect(descriptions).toEqual([
      'Enviar a proposta ao cliente (ajustada)',
      'Feito à mão',
      'Revisar o contrato com o jurídico',
    ]);
  });

  it('deve seguir a revisão ao salvá-la e não mexer nos combinados ao reanalisar um encontro revisado', async () => {
    const ctx = setup([
      output([agreement('Fica como está'), agreement('Será removido')]),
      output([agreement('Veio de uma nova análise')]),
    ]);
    const reportId = await createReport(ctx.app);
    const sessionId = await createSession(ctx.app, reportId, '2026-10-01');
    const analysisId = await analyse(ctx, sessionId);

    const current = await listSession(ctx.app, sessionId);
    const keep = current.find((item) => item.description === 'Fica como está');
    const saved = await review(ctx.app, sessionId, analysisId, {
      // Na revisão as observações apontam para ids de responsabilidade (aqui, nenhuma).
      ...output([
        { ...agreement('Fica como está (revisado)', '2026-10-30'), id: keep?.id } as never,
        agreement('Adicionado na revisão'),
      ]),
      development_signals: [],
    });
    expect(saved.status).toBe(200);

    const afterReview = await listSession(ctx.app, sessionId);
    const byDescription = (text: string) => afterReview.find((item) => item.description === text);
    expect(byDescription('Fica como está (revisado)')).toMatchObject({
      status: 'open',
      isConfirmed: true,
      dueDate: '2026-10-30',
    });
    expect(byDescription('Será removido')).toMatchObject({ status: 'cancelled' });
    expect(byDescription('Adicionado na revisão')).toMatchObject({
      origin: 'leader',
      isConfirmed: true,
    });

    await analyse(ctx, sessionId);

    expect(await listSession(ctx.app, sessionId)).toHaveLength(afterReview.length);
    expect(
      (await listSession(ctx.app, sessionId)).some(
        (item) => item.description === 'Veio de uma nova análise',
      ),
    ).toBe(false);
  });

  it('deve mostrar os combinados abertos ao próximo encontro e só aplicar a sugestão ao salvar a revisão', async () => {
    const ctx = setup([output([agreement('Revisar o painel')])]);
    const reportId = await createReport(ctx.app);
    const firstSession = await createSession(ctx.app, reportId, '2026-09-10');
    await analyse(ctx, firstSession);
    const [previous] = await listSession(ctx.app, firstSession);

    const second = setup([
      output([agreement('Escrever a documentação')], {
        previous_agreements: [
          { id: previous?.id ?? '', suggested_status: 'done', evidence: 'Já publiquei.' },
        ],
      }),
    ]);
    const secondSession = await createSession(second.app, reportId, '2026-10-01');
    const secondAnalysis = await analyse(second, secondSession);

    const context = second.fake.calls[0]?.user ?? '';
    expect(context).toContain(previous?.id);
    expect(context).toContain('Revisar o painel');
    expect(context).not.toContain('Escrever a documentação');

    const stillOpen = (
      await authed(second.app).get(`/api/v1/direct-reports/${reportId}/agreements`)
    ).body;
    expect(stillOpen.find((item: { id: string }) => item.id === previous?.id).status).toBe('open');

    const raw = (await authed(second.app).get(`/api/v1/analyses/${secondAnalysis}`)).body.rawJson;
    await review(second.app, secondSession, secondAnalysis, raw);

    const afterReview = (
      await authed(second.app).get(`/api/v1/direct-reports/${reportId}/agreements`)
    ).body;
    expect(afterReview.find((item: { id: string }) => item.id === previous?.id)).toMatchObject({
      status: 'done',
      isConfirmed: true,
    });
  });

  it('deve filtrar por situação, inclusive atrasados, e paginar a visão geral', async () => {
    const ctx = setup([
      output([
        agreement('Vencido', '2026-01-10'),
        agreement('No futuro', '2099-01-01'),
        agreement('Sem prazo'),
      ]),
    ]);
    const reportId = await createReport(ctx.app);
    const sessionId = await createSession(ctx.app, reportId, '2026-10-01');
    await analyse(ctx, sessionId);
    const overdue = (await listSession(ctx.app, sessionId)).find(
      (item) => item.description === 'Vencido',
    );
    await authed(ctx.app).patch(`/api/v1/agreements/${overdue?.id}`).send({ status: 'open' });

    const late = await authed(ctx.app).get('/api/v1/agreements?status=overdue');
    expect(late.body.data.map((item: { description: string }) => item.description)).toEqual([
      'Vencido',
    ]);
    expect(late.body.data[0].isOverdue).toBe(true);

    const open = await authed(ctx.app).get('/api/v1/agreements?status=open&pageSize=2');
    expect(open.body.meta).toMatchObject({ total: 3, pageSize: 2 });
    expect(open.body.data).toHaveLength(2);

    const done = await authed(ctx.app).get('/api/v1/agreements?status=done');
    expect(done.body.meta.total).toBe(0);
  });

  it('deve responder 400 para dados inválidos e 404 para combinado inexistente', async () => {
    const ctx = setup([]);
    const reportId = await createReport(ctx.app);

    expect(
      (
        await authed(ctx.app)
          .post(`/api/v1/direct-reports/${reportId}/agreements`)
          .send({ description: '', owner: 'leader' })
      ).status,
    ).toBe(400);
    expect(
      (
        await authed(ctx.app)
          .patch('/api/v1/agreements/018f0000-0000-7000-8000-0000000000ff')
          .send({ status: 'done' })
      ).status,
    ).toBe(404);
  });

  it('deve esconder combinados e linha do tempo de uma pessoa excluída', async () => {
    const ctx = setup([output([agreement('Combinado de quem será excluída')])]);
    const reportId = await createReport(ctx.app);
    const sessionId = await createSession(ctx.app, reportId, '2026-10-01');
    await analyse(ctx, sessionId);

    await authed(ctx.app).delete(`/api/v1/direct-reports/${reportId}`);

    expect((await authed(ctx.app).get('/api/v1/agreements')).body.meta.total).toBe(0);
    expect(
      (await authed(ctx.app).get(`/api/v1/direct-reports/${reportId}/agreements`)).status,
    ).toBe(404);
    expect((await authed(ctx.app).get(`/api/v1/sessions/${sessionId}/agreements`)).status).toBe(
      404,
    );
    expect((await authed(ctx.app).get(`/api/v1/direct-reports/${reportId}/timeline`)).status).toBe(
      404,
    );
  });
});

describe('timeline', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('deve montar a linha do tempo em ordem, sem as observações privadas, com sinais e combinados', async () => {
    const ctx = setup([
      output([agreement('Primeiro combinado')]),
      output([agreement('Segundo combinado')]),
    ]);
    const reportId = await createReport(ctx.app);
    const later = await createSession(ctx.app, reportId, '2026-10-01');
    const earlier = await createSession(ctx.app, reportId, '2026-09-10');
    const earlierAnalysis = await analyse(ctx, earlier);
    await analyse(ctx, later);
    const raw = (await authed(ctx.app).get(`/api/v1/analyses/${earlierAnalysis}`)).body.rawJson;
    await review(ctx.app, earlier, earlierAnalysis, { ...raw, summary: 'Resumo revisado.' });

    const response = await authed(ctx.app).get(`/api/v1/direct-reports/${reportId}/timeline`);

    expect(response.status).toBe(200);
    expect(response.body.entries.map((entry: { heldOn: string }) => entry.heldOn)).toEqual([
      '2026-09-10',
      '2026-10-01',
    ]);
    expect(response.body.entries[0]).toMatchObject({
      isReviewed: true,
      summary: 'Resumo revisado.',
    });
    expect(response.body.entries[1]).toMatchObject({ isReviewed: false });
    expect(response.body.responsibilities[0].points).toHaveLength(2);
    expect(response.body.totals.agreements).toBe(2);
    expect(JSON.stringify(response.body)).not.toContain('NOTA-PRIVADA');
    expect(JSON.stringify(response.body)).not.toContain('FEEDBACK-PRIVADO-DO-LIDER');
  });
});
