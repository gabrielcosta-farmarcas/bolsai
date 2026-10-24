import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { agreementsRepository } from './modules/agreements/agreements.repository.js';
import { makeDefaultAnalysesService } from './modules/analyses/analyses.routes.js';
import { analysesRepository } from './modules/analyses/analyses.repository.js';
import type { AnalysisOutput } from './modules/analyses/analysis.schema.js';
import { directReportsRepository } from './modules/direct-reports/direct-reports.repository.js';
import { responsibilityMapsRepository } from './modules/responsibility-maps/responsibility-maps.repository.js';
import { sessionsRepository } from './modules/sessions/sessions.repository.js';
import { makeFakeAiClient } from './shared/ai/fake-ai-client.js';
import { prisma } from './shared/database/prisma.js';
import { assertOwnsReport, assertOwnsSession } from './shared/security/ownership.js';
import { authed, createTestSession } from './test/auth.js';
import { newPersonBody, sampleResponsibilities } from './test/responsibilities.js';
import { sampleLeaderFeedback } from './test/leader-feedback.js';
import { resetDatabase } from './test/reset-database.js';

// Duas líderes, um único servidor: o que é de uma nunca aparece nem muda para a outra,
// por nenhuma rota, nem sabendo os ids. Quem entrou sem ser líder não alcança nada.

const SECRET = 'SEGREDO-DA-LIDER-A';
const API = '/api/v1';

const analysis: AnalysisOutput = {
  summary: `Resumo reservado. ${SECRET}`,
  themes: [{ title: 'Tema', detail: 'Detalhe' }],
  agreements: [
    {
      description: 'Enviar a proposta',
      owner: 'report',
      due_date: null,
      evidence_excerpt: 'Eu te mando a proposta.',
    },
  ],
  previous_agreements: [],
  development_signals: [{ responsibility_ref: 'R1', observation: 'Boa.', kind: 'growth' }],
  attention_points: [],
  next_questions: ['O que te motiva hoje?'],
  private_leader_notes: `Nota privada. ${SECRET}`,
  leader_feedback: sampleLeaderFeedback,
};

type Ids = {
  report: string;
  map: string;
  session: string;
  analysis: string;
  agreement: string;
  responsibility: string;
};

describe('isolamento entre líderes', () => {
  let app: ReturnType<typeof createApp>;
  let cookieA: string;
  let cookieB: string;
  let leaderB: string;
  let leaderA: string;
  let ids: Ids;

  const asA = () => authed(app, cookieA);
  const asB = () => authed(app, cookieB);

  beforeEach(async () => {
    await resetDatabase();
    const jobs: Array<() => Promise<void>> = [];
    const fake = makeFakeAiClient([analysis]);
    app = createApp({
      analysesService: makeDefaultAnalysesService({
        getAiClient: () => fake.client,
        schedule: (job) => {
          jobs.push(job);
        },
      }),
    });

    leaderA = (await prisma.leader.findFirstOrThrow({ where: { keycloakSubject: null } })).id;
    leaderB = (await prisma.leader.create({ data: { name: 'Bia', keycloakSubject: 'leader-b' } }))
      .id;
    cookieA = await createTestSession({ subject: 'leader-a', leaderId: leaderA });
    cookieB = await createTestSession({ subject: 'leader-b', leaderId: leaderB });

    // Tudo isto é da líder A.
    const report = (
      await asA()
        .post(`${API}/direct-reports`)
        .send(newPersonBody({ name: `Ellen ${SECRET}`, role: 'Analista', startedAt: '2025-01-20' }))
    ).body.id as string;
    const map = (
      await asA()
        .post(`${API}/direct-reports/${report}/responsibility-maps`)
        .send({ responsibilities: [...sampleResponsibilities, SECRET] })
    ).body.id as string;
    const session = (
      await asA()
        .post(`${API}/direct-reports/${report}/sessions`)
        .send({ heldOn: '2026-10-01', transcript: `Ellen: ${SECRET}` })
    ).body.id as string;
    const started = await asA().post(`${API}/sessions/${session}/analyses`).send({});
    for (const job of jobs.splice(0)) await job();
    const analysisId = started.body.id as string;
    const raw = (await asA().get(`${API}/analyses/${analysisId}`)).body.rawJson;
    await asA().put(`${API}/sessions/${session}/review`).send({ analysisId, reviewedJson: raw });
    const agreement = (
      await asA()
        .post(`${API}/direct-reports/${report}/agreements`)
        .send({ description: `Combinado ${SECRET}`, owner: 'leader', sessionId: session })
    ).body.id as string;

    const responsibility = (await asA().get(`${API}/direct-reports/${report}/responsibilities`))
      .body[0].id as string;

    ids = { report, map, session, analysis: analysisId, agreement, responsibility };
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  type Call = [
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: () => string,
    body?: () => object,
  ];

  // Toda rota que usa um id de dono. Para outra líder, nenhuma pode revelar nem alterar.
  const byId: Call[] = [
    ['get', () => `${API}/direct-reports/${ids.report}`],
    ['patch', () => `${API}/direct-reports/${ids.report}`, () => ({ name: 'Invadida' })],
    ['delete', () => `${API}/direct-reports/${ids.report}`],
    ['get', () => `${API}/direct-reports/${ids.report}/sessions`],
    [
      'post',
      () => `${API}/direct-reports/${ids.report}/sessions`,
      () => ({ heldOn: '2026-10-02', transcript: 'x' }),
    ],
    ['get', () => `${API}/direct-reports/${ids.report}/responsibility-maps`],
    [
      'post',
      () => `${API}/direct-reports/${ids.report}/responsibility-maps`,
      () => ({ responsibilities: sampleResponsibilities }),
    ],
    ['get', () => `${API}/direct-reports/${ids.report}/responsibilities`],
    ['get', () => `${API}/direct-reports/${ids.report}/responsibilities?retired=true`],
    ['patch', () => `${API}/responsibilities/${ids.responsibility}`, () => ({ title: 'Invadida' })],
    ['get', () => `${API}/responsibility-maps/${ids.map}`],
    ['get', () => `${API}/responsibility-maps/${ids.map}/file`],
    ['get', () => `${API}/sessions/${ids.session}`],
    ['patch', () => `${API}/sessions/${ids.session}`, () => ({ transcript: 'trocada' })],
    ['get', () => `${API}/sessions/${ids.session}/analyses`],
    ['post', () => `${API}/sessions/${ids.session}/analyses`, () => ({})],
    ['get', () => `${API}/analyses/${ids.analysis}`],
    [
      'put',
      () => `${API}/sessions/${ids.session}/review`,
      () => ({ analysisId: ids.analysis, reviewedJson: {} }),
    ],
    ['get', () => `${API}/sessions/${ids.session}/agreements`],
    ['get', () => `${API}/direct-reports/${ids.report}/agreements`],
    [
      'post',
      () => `${API}/direct-reports/${ids.report}/agreements`,
      () => ({ description: 'x', owner: 'leader' }),
    ],
    ['patch', () => `${API}/agreements/${ids.agreement}`, () => ({ status: 'done' })],
    ['get', () => `${API}/direct-reports/${ids.report}/timeline`],
    ['get', () => `${API}/direct-reports/${ids.report}/preparations/latest`],
    ['post', () => `${API}/direct-reports/${ids.report}/preparations`, () => ({})],
  ];

  // Listas sem id: respondem 200, mas só com o que é da própria líder.
  const lists: Array<() => string> = [
    () => `${API}/direct-reports`,
    () => `${API}/direct-reports?status=inactive`,
    () => `${API}/agreements`,
    () => `${API}/agreements?status=open`,
    () => `${API}/agreements?directReportId=${ids.report}`,
  ];

  it('deve mostrar tudo à dona (a base do teste funciona)', async () => {
    // O download do arquivo do responsograma dá 404 até para a dona: este foi colado como texto, sem arquivo.
    for (const [method, url] of byId.filter(([m, u]) => m === 'get' && !u().endsWith('/file'))) {
      const response = await asA()[method](url());
      expect(response.status, `${method} ${url()}`).toBe(200);
    }
  });

  it.each(byId.map((call, index) => [`${call[0].toUpperCase()} #${index}`, call] as const))(
    'deve responder 404 à outra líder, sem revelar nada: %s',
    async (_name, [method, url, body]) => {
      const response = await asB()
        [method](url())
        .send(body?.() ?? {});

      expect(response.status, `${method} ${url()}`).toBe(404);
      expect(JSON.stringify(response.body)).not.toContain(SECRET);
      for (const id of Object.values(ids)) expect(JSON.stringify(response.body)).not.toContain(id);
    },
  );

  it.each(lists.map((url, index) => [`lista #${index}`, url] as const))(
    'deve devolver à outra líder só o que é dela: %s',
    async (_name, url) => {
      const response = await asB().get(url());

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(JSON.stringify(response.body)).not.toContain(SECRET);
      for (const id of Object.values(ids)) expect(JSON.stringify(response.body)).not.toContain(id);
    },
  );

  it('não deve alterar nada da dona depois de todas as tentativas da outra', async () => {
    const before = await snapshot(ids);

    for (const [method, url, body] of byId)
      await asB()
        [method](url())
        .send(body?.() ?? {});
    for (const url of lists) await asB().get(url());

    expect(await snapshot(ids)).toEqual(before);
    expect(before.report?.name).toContain(SECRET);
  });

  it('deve manter separado o que a outra líder cria', async () => {
    const created = await asB()
      .post(`${API}/direct-reports`)
      .send(newPersonBody({ name: 'Carlos', role: 'Dev', startedAt: '2025-02-01' }));
    expect(created.status).toBe(201);

    const mine = await asB().get(`${API}/direct-reports`);
    const theirs = await asA().get(`${API}/direct-reports`);

    expect(mine.body.data.map((r: { name: string }) => r.name)).toEqual(['Carlos']);
    expect(theirs.body.data.map((r: { name: string }) => r.name)).not.toContain('Carlos');
    expect((await asA().get(`${API}/direct-reports/${created.body.id}`)).status).toBe(404);
  });

  describe('quem entrou sem ser líder', () => {
    it.each([
      ['administrador', ['administrador']],
      ['liderado', ['liderado']],
      ['sem papel', []],
    ])('deve receber 403 em toda rota de conteúdo: %s', async (_name, roles) => {
      const cookie = await createTestSession({
        subject: `x-${roles.join('')}`,
        roles,
        leaderId: null,
      });
      const client = authed(app, cookie);

      for (const [method, url, body] of byId) {
        const response = await client[method](url()).send(body?.() ?? {});
        expect(response.status, `${method} ${url()}`).toBe(403);
      }
      const upload = await client
        .post(`${API}/responsibility-maps/extract`)
        .attach('file', Buffer.from('texto qualquer'), 'a.txt');
      expect(upload.status).toBe(403);
      for (const url of [...lists.map((u) => u()), `${API}/rota-nova`]) {
        expect((await client.get(url)).status, url).toBe(403);
      }
    });

    it('não deve dar acesso nem a quem tem papel de líder mas está sem líder ligada', async () => {
      const cookie = await createTestSession({
        subject: 'sem-lider',
        roles: ['lider'],
        leaderId: null,
      });

      expect((await authed(app, cookie).get(`${API}/direct-reports`)).status).toBe(403);
    });
  });

  describe('barreira no banco (mesmo que um service esqueça de conferir)', () => {
    const rejects = (promise: PromiseLike<unknown>) =>
      expect(Promise.resolve(promise)).rejects.toMatchObject({ code: 'P2025' });

    it('deve recusar criar algo ligado a registro de outra líder', async () => {
      await rejects(assertOwnsReport(prisma, leaderB, ids.report));
      await rejects(assertOwnsSession(prisma, leaderB, ids.session));
      await rejects(
        sessionsRepository.create(leaderB, ids.report, { heldOn: '2026-10-05', transcript: 'x' }),
      );
      await rejects(
        agreementsRepository.create(leaderB, ids.report, {
          description: 'x',
          owner: 'leader',
          dueDate: null,
          originSessionId: null,
          confirmedAt: new Date(),
        }),
      );
      await rejects(analysesRepository.create(leaderB, ids.session, { mapVersionUsed: null }));
      await rejects(
        responsibilityMapsRepository.createNextVersion(leaderB, ids.report, {
          text: 'x',
          mission: null,
          behaviors: null,
          responsibilities: '1. a',
          items: [{ text: 'Atender os clientes', key: 'atender os clientes' }],
        }),
      );
    });

    it('deve recusar alterar ou excluir registro de outra líder', async () => {
      await rejects(directReportsRepository.update(leaderB, ids.report, { name: 'Invadida' }));
      await rejects(directReportsRepository.softDelete(leaderB, ids.report));
      await rejects(sessionsRepository.update(leaderB, ids.session, { transcript: 'trocada' }));
      await rejects(agreementsRepository.update(leaderB, ids.agreement, { status: 'done' }));
      await rejects(
        analysesRepository.saveFinal(leaderB, ids.session, ids.analysis, {} as never, new Date()),
      );
    });

    it('deve deixar a dona fazer tudo isso normalmente', async () => {
      await expect(assertOwnsReport(prisma, leaderA, ids.report)).resolves.toBeTruthy();
      await expect(
        directReportsRepository.update(leaderA, ids.report, { role: 'Sênior' }),
      ).resolves.toMatchObject({ role: 'Sênior' });
    });
  });
});

const snapshot = async (ids: Ids) => ({
  report: await prisma.directReport.findUnique({ where: { id: ids.report } }),
  session: await prisma.session.findUnique({ where: { id: ids.session } }),
  agreement: await prisma.agreement.findUnique({ where: { id: ids.agreement } }),
  analysis: await prisma.analysis.findUnique({ where: { id: ids.analysis } }),
  counts: {
    reports: await prisma.directReport.count(),
    maps: await prisma.responsibilityMap.count(),
    sessions: await prisma.session.count(),
    analyses: await prisma.analysis.count(),
    agreements: await prisma.agreement.count(),
  },
});
