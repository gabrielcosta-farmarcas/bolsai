import { readFile } from 'node:fs/promises';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app, createApp } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { authed } from '../../test/auth.js';
import { newPersonBody, sampleResponsibilities } from '../../test/responsibilities.js';
import { responsibilitiesRepository } from '../responsibilities/responsibilities.repository.js';
import { makeTitleSuggester } from '../responsibilities/titles.js';
import { resetDatabase } from '../../test/reset-database.js';

const REPORTS = '/api/v1/direct-reports';
const fixture = (name: string) =>
  readFile(new URL(`../../shared/files/__fixtures__/${name}`, import.meta.url));

const newReport = newPersonBody();

const createReport = async (overrides: Record<string, unknown> = {}) => {
  const response = await authed(app)
    .post(REPORTS)
    .send({ ...newReport, ...overrides });
  return response.body as { id: string };
};

describe('direct reports', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('deve criar, ler, editar e listar liderados', async () => {
    const created = await authed(app).post(REPORTS).send(newReport);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      name: newReport.name,
      role: newReport.role,
      startedAt: newReport.startedAt,
      status: 'active',
    });

    const edited = await authed(app)
      .patch(`${REPORTS}/${created.body.id}`)
      .send({ role: 'Analista sênior', status: 'inactive' });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ role: 'Analista sênior', status: 'inactive' });

    const list = await authed(app).get(`${REPORTS}?status=inactive`);
    expect(list.body.meta.total).toBe(1);
    expect(list.body.data[0].name).toBe('Ana Souza');
    expect((await authed(app).get(`${REPORTS}?status=active`)).body.meta.total).toBe(0);
  });

  it('deve ordenar nomes com acento em português', async () => {
    await createReport({ name: 'Zélia' });
    await createReport({ name: 'Álvaro' });
    await createReport({ name: 'Bruno' });

    const names = (await authed(app).get(REPORTS)).body.data.map((r: { name: string }) => r.name);

    expect(names).toEqual(['Álvaro', 'Bruno', 'Zélia']);
  });

  it('deve responder 400 para dados inválidos e 404 para id inexistente', async () => {
    const invalid = await authed(app)
      .post(REPORTS)
      .send({ name: '', role: 'x', startedAt: '10/03/2025' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const missing = await authed(app).get(`${REPORTS}/018f0000-0000-7000-8000-0000000000ff`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('DIRECT_REPORT_NOT_FOUND');
  });

  it('deve esconder o liderado excluído e tudo que é dele', async () => {
    const report = await createReport();
    const map = await authed(app)
      .post(`${REPORTS}/${report.id}/responsibility-maps`)
      .send({ responsibilities: sampleResponsibilities });
    expect(map.status).toBe(201);

    const removed = await authed(app).delete(`${REPORTS}/${report.id}`);
    expect(removed.status).toBe(204);

    expect((await authed(app).get(`${REPORTS}/${report.id}`)).status).toBe(404);
    expect((await authed(app).get(REPORTS)).body.meta.total).toBe(0);
    expect((await authed(app).get(`${REPORTS}/${report.id}/responsibility-maps`)).status).toBe(404);
    expect((await authed(app).get(`/api/v1/responsibility-maps/${map.body.id}`)).status).toBe(404);
    expect((await authed(app).delete(`${REPORTS}/${report.id}`)).status).toBe(404);
  });
});

describe('direct reports — resumo na lista', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('deve trazer a data do último encontro e quantos combinados estão em aberto', async () => {
    const report = await createReport();
    expect((await authed(app).get(`${REPORTS}/${report.id}`)).body).toMatchObject({
      lastSessionOn: null,
      openAgreements: 0,
    });

    const session = await prisma.session.create({
      data: {
        leaderId: FIXED_LEADER_ID,
        directReportId: report.id,
        heldOn: new Date('2026-10-01T00:00:00.000Z'),
        transcript: 'x',
      },
    });
    await prisma.session.create({
      data: {
        leaderId: FIXED_LEADER_ID,
        directReportId: report.id,
        heldOn: new Date('2026-09-10T00:00:00.000Z'),
        transcript: 'y',
      },
    });
    for (const status of ['open', 'open', 'done'] as const) {
      await prisma.agreement.create({
        data: {
          leaderId: FIXED_LEADER_ID,
          directReportId: report.id,
          originSessionId: session.id,
          description: 'c',
          owner: 'report',
          origin: 'leader',
          status,
        },
      });
    }

    const list = (await authed(app).get(REPORTS)).body.data;
    expect(list[0]).toMatchObject({ lastSessionOn: '2026-10-01', openAgreements: 2 });
  });
});

describe('responsograma no cadastro', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('deve criar a pessoa com a versão 1 do responsograma e as responsabilidades em ordem', async () => {
    const created = await authed(app)
      .post(REPORTS)
      .send(newPersonBody({ mission: 'Garantir o sucesso do cliente' }));
    expect(created.status).toBe(201);

    const maps = (await authed(app).get(`${REPORTS}/${created.body.id}/responsibility-maps`)).body;
    expect(maps).toHaveLength(1);
    expect(maps[0]).toMatchObject({
      version: 1,
      isCurrent: true,
      mission: 'Garantir o sucesso do cliente',
    });
    expect(maps[0]).not.toHaveProperty('hasFile');
    expect(maps[0]).not.toHaveProperty('fileName');
    const detail = await authed(app).get(`/api/v1/responsibility-maps/${maps[0].id}`);
    expect(detail.body.text).toContain('RESPONSABILIDADES\n1. Mapear e atuar');

    const list = await authed(app).get(`${REPORTS}/${created.body.id}/responsibilities`);
    expect(list.status).toBe(200);
    expect(list.body.map((r: { position: number }) => r.position)).toEqual([1, 2, 3, 4]);
    expect(list.body[0]).toMatchObject({
      text: sampleResponsibilities[0],
      titleSource: 'fallback',
      retired: false,
    });
    expect(list.body[0].title.length).toBeLessThanOrEqual(60);
    expect(list.body[0].title.endsWith('…')).toBe(true);
  });

  it('deve guardar os comportamentos desejados na versão 1 e devolvê-los no histórico', async () => {
    const created = await authed(app)
      .post(REPORTS)
      .send(newPersonBody({ behaviors: 'Pensamento crítico\nBoa comunicação' }));
    expect(created.status).toBe(201);

    const maps = (await authed(app).get(`${REPORTS}/${created.body.id}/responsibility-maps`)).body;
    expect(maps[0]).toMatchObject({ version: 1, behaviors: 'Pensamento crítico\nBoa comunicação' });
    const detail = await authed(app).get(`/api/v1/responsibility-maps/${maps[0].id}`);
    expect(detail.body.text).toContain('COMPORTAMENTOS DESEJADOS\nPensamento crítico');
  });

  it('deve recusar comportamentos acima de 3.000 caracteres', async () => {
    const response = await authed(app)
      .post(REPORTS)
      .send(newPersonBody({ behaviors: 'a'.repeat(3001) }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(await prisma.directReport.count()).toBe(0);
  });

  it('não deve criar a pessoa com menos de 3 responsabilidades, nem com mais de 10', async () => {
    const few = await authed(app)
      .post(REPORTS)
      .send(
        newPersonBody({
          responsibilities: [sampleResponsibilities[0], '  ', sampleResponsibilities[1]],
        }),
      );
    const none = await authed(app)
      .post(REPORTS)
      .send({ name: 'Ana', role: 'Analista', startedAt: '2025-03-10' });
    const many = await authed(app)
      .post(REPORTS)
      .send(
        newPersonBody({
          responsibilities: Array.from(
            { length: 11 },
            (_, i) => `Responsabilidade número ${i + 1}`,
          ),
        }),
      );

    expect(few.status).toBe(422);
    expect(few.body.error).toMatchObject({
      code: 'TOO_FEW_RESPONSIBILITIES',
      message: 'Preencha pelo menos 3 responsabilidades. Falta 1.',
    });
    expect(none.status).toBe(400);
    expect(many.status).toBe(422);
    expect(many.body.error.code).toBe('TOO_MANY_RESPONSIBILITIES');
    expect(await prisma.directReport.count()).toBe(0);
    expect(await prisma.responsibility.count()).toBe(0);
  });
});

describe('responsibility maps — versões e histórico', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  const idsByText = async (reportId: string, includeRetired = true) => {
    const list = (
      await authed(app).get(
        `${REPORTS}/${reportId}/responsibilities${includeRetired ? '?retired=true' : ''}`,
      )
    ).body as Array<{ id: string; text: string; position: number; retired: boolean }>;
    return Object.fromEntries(list.map((item) => [item.text, item]));
  };

  it('deve criar nova versão ao mudar só os comportamentos, sem mexer nas responsabilidades', async () => {
    const report = await createReport({ behaviors: 'Empatia' });
    const url = `${REPORTS}/${report.id}/responsibility-maps`;
    const before = await idsByText(report.id);

    const second = await authed(app)
      .post(url)
      .send({ behaviors: 'Empatia\nVisão sistêmica', responsibilities: sampleResponsibilities });
    expect(second.status).toBe(201);
    expect(second.body).toMatchObject({ version: 2, behaviors: 'Empatia\nVisão sistêmica' });

    const maps = (await authed(app).get(url)).body as Array<{ version: number; behaviors: string }>;
    expect(maps.find((map) => map.version === 1)?.behaviors).toBe('Empatia');
    expect(await idsByText(report.id)).toEqual(before);

    const tooLong = await authed(app)
      .post(url)
      .send({ behaviors: 'a'.repeat(3001), responsibilities: sampleResponsibilities });
    expect(tooLong.status).toBe(400);
  });

  it('deve manter o histórico das iguais, aposentar as removidas e reativar as que voltam', async () => {
    const report = await createReport({
      responsibilities: [
        'Alfa responsabilidade',
        'Beta responsabilidade',
        'Gama responsabilidade',
        'Delta responsabilidade',
      ],
    });
    const url = `${REPORTS}/${report.id}/responsibility-maps`;
    const v1 = await idsByText(report.id);

    // Versão 2: reordena, edita a Beta (vira nova) e tira a Delta.
    const second = await authed(app)
      .post(url)
      .send({
        responsibilities: [
          'Gama responsabilidade',
          'ALFA   responsabilidade',
          'Beta responsabilidade ajustada',
        ],
      });
    expect(second.status).toBe(201);
    expect(second.body).toMatchObject({ version: 2, isCurrent: true });
    const v2 = await idsByText(report.id);

    expect(v2['Gama responsabilidade']).toMatchObject({
      id: v1['Gama responsabilidade']?.id,
      position: 1,
      retired: false,
    });
    expect(v2['ALFA responsabilidade']).toMatchObject({
      id: v1['Alfa responsabilidade']?.id,
      position: 2,
      retired: false,
    });
    expect(v2['Beta responsabilidade ajustada']).toMatchObject({ position: 3, retired: false });
    expect(v2['Beta responsabilidade ajustada']?.id).not.toBe(v1['Beta responsabilidade']?.id);
    expect(v2['Beta responsabilidade']).toMatchObject({
      id: v1['Beta responsabilidade']?.id,
      retired: true,
    });
    expect(v2['Delta responsabilidade']).toMatchObject({
      id: v1['Delta responsabilidade']?.id,
      retired: true,
    });

    const active = (await authed(app).get(`${REPORTS}/${report.id}/responsibilities`)).body;
    expect(active.map((r: { position: number }) => r.position)).toEqual([1, 2, 3]);

    // Versão 3: a Delta volta (escrita com outras maiúsculas) e reaparece com o mesmo registro.
    await authed(app)
      .post(url)
      .send({
        responsibilities: [
          'Gama responsabilidade',
          'Alfa responsabilidade',
          'delta  RESPONSABILIDADE',
        ],
      });
    const v3 = await idsByText(report.id);
    const back = Object.values(v3).find((item) => item.id === v1['Delta responsabilidade']?.id);
    expect(back).toMatchObject({ retired: false, position: 3 });

    const list = await authed(app).get(url);
    expect(
      list.body.map((m: { version: number; isCurrent: boolean }) => [m.version, m.isCurrent]),
    ).toEqual([
      [3, true],
      [2, false],
      [1, false],
    ]);
  });

  it('não deve salvar a nova versão com menos de 3 e deve manter a atual', async () => {
    const report = await createReport();
    const url = `${REPORTS}/${report.id}/responsibility-maps`;

    const refused = await authed(app)
      .post(url)
      .send({ responsibilities: ['Só uma responsabilidade'] });

    expect(refused.status).toBe(422);
    expect(refused.body.error.code).toBe('TOO_FEW_RESPONSIBILITIES');
    expect((await authed(app).get(url)).body).toHaveLength(1);
    expect(
      (await authed(app).get(`${url.replace('responsibility-maps', 'responsibilities')}`)).body,
    ).toHaveLength(4);
  });

  it('deve responder 400 sem a lista e 404 para pessoa inexistente', async () => {
    const report = await createReport();

    const empty = await authed(app).post(`${REPORTS}/${report.id}/responsibility-maps`).send({});
    const old = await authed(app)
      .post(`${REPORTS}/${report.id}/responsibility-maps`)
      .send({ text: 'x' });
    const missing = await authed(app)
      .post(`${REPORTS}/018f0000-0000-7000-8000-0000000000ff/responsibility-maps`)
      .send({ responsibilities: sampleResponsibilities });

    expect(empty.status).toBe(400);
    expect(old.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('não deve mais guardar nem oferecer arquivo do responsograma', async () => {
    const report = await createReport();
    const [first] = (await authed(app).get(`${REPORTS}/${report.id}/responsibility-maps`)).body;

    const download = await authed(app).get(`/api/v1/responsibility-maps/${first.id}/file`);
    const upload = await authed(app)
      .post(`${REPORTS}/${report.id}/responsibility-maps`)
      .attach('file', await fixture('exemplo.docx'), 'a.docx');

    expect(download.status).toBe(404);
    expect(upload.status).toBe(400);
    expect(await prisma.responsibilityMap.count({ where: { fileBytes: { not: null } } })).toBe(0);
  });
});

describe('responsibility maps — preencher a partir de um arquivo', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('deve devolver uma proposta e não salvar nada nem guardar o arquivo', async () => {
    const report = await createReport();
    const url = '/api/v1/responsibility-maps/extract';

    const response = await authed(app)
      .post(url)
      .attach('file', await fixture('exemplo.docx'), 'Responsograma Ação.docx');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('responsibilities');
    expect(response.body).toHaveProperty('leftOut');
    expect(response.body.responsibilities.join(' ')).toContain('Gestão de pessoas e comunicação');
    expect(
      (await authed(app).get(`${REPORTS}/${report.id}/responsibility-maps`)).body,
    ).toHaveLength(1);
    expect(await prisma.responsibilityMap.count({ where: { fileBytes: { not: null } } })).toBe(0);
  });

  it('deve aceitar PDF com texto e recusar PDF escaneado, tipo desconhecido e pedido sem arquivo', async () => {
    const url = '/api/v1/responsibility-maps/extract';

    const ok = await authed(app)
      .post(url)
      .attach('file', await fixture('com-texto.pdf'), 'a.pdf');
    const scanned = await authed(app)
      .post(url)
      .attach('file', await fixture('sem-texto.pdf'), 'scan.pdf');
    const wrongType = await authed(app).post(url).attach('file', Buffer.from('x'), 'a.xlsx');
    const none = await authed(app).post(url).send({});

    expect(ok.status).toBe(200);
    expect(scanned.status).toBe(422);
    expect(scanned.body.error.code).toBe('UNREADABLE_FILE');
    expect(wrongType.status).toBe(415);
    expect(none.status).toBe(400);
  });
});

describe('responsabilidades — títulos', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  const setup = (outputs: unknown[]) => {
    const fake = makeFakeAiClient(outputs);
    const jobs: Array<() => Promise<void>> = [];
    const titles = makeTitleSuggester({
      repo: responsibilitiesRepository,
      getAiClient: () => fake.client,
      schedule: (job) => {
        jobs.push(job);
      },
    });
    const withAi = createApp({ titles });
    const runJobs = async () => {
      for (const job of jobs.splice(0)) await job();
    };
    return { withAi, runJobs, fake };
  };

  it('deve responder na hora com o título de reserva e a IA melhorar depois', async () => {
    const { withAi, runJobs } = setup([
      {
        titles: [
          { ref: 'R1', title: 'Pontos de atrito' },
          { ref: 'R2', title: 'Atendimento' },
          { ref: 'R3', title: 'Implementações' },
          { ref: 'R4', title: 'Registro no CRM' },
        ],
      },
    ]);
    const created = await authed(withAi).post(REPORTS).send(newReport);
    const listUrl = `${REPORTS}/${created.body.id}/responsibilities`;
    expect((await authed(withAi).get(listUrl)).body[0].titleSource).toBe('fallback');

    await runJobs();

    const after = (await authed(withAi).get(listUrl)).body;
    expect(after.map((r: { title: string }) => r.title)).toEqual([
      'Pontos de atrito',
      'Atendimento',
      'Implementações',
      'Registro no CRM',
    ]);
    expect(after.every((r: { titleSource: string }) => r.titleSource === 'ai')).toBe(true);
    expect(after[0].text).toBe(sampleResponsibilities[0]);
  });

  it('deve salvar mesmo com a IA falhando, e nunca sobrescrever o título da líder', async () => {
    const { withAi, runJobs } = setup([
      new Error('IA fora do ar'),
      { titles: [{ ref: 'R1', title: 'Título da IA' }] },
    ]);
    const created = await authed(withAi).post(REPORTS).send(newReport);
    expect(created.status).toBe(201);
    await runJobs();
    const listUrl = `${REPORTS}/${created.body.id}/responsibilities`;
    const [first] = (await authed(withAi).get(listUrl)).body;
    expect(first.titleSource).toBe('fallback');

    const edited = await authed(withAi)
      .patch(`/api/v1/responsibilities/${first.id}`)
      .send({ title: '  Meu título  ' });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ title: 'Meu título', titleSource: 'leader' });

    // Nova versão: a IA tenta de novo, mas só pode mexer nos que ainda são de reserva.
    await authed(withAi)
      .post(`${REPORTS}/${created.body.id}/responsibility-maps`)
      .send({ responsibilities: sampleResponsibilities });
    await runJobs();
    const after = (await authed(withAi).get(listUrl)).body;
    expect(after[0]).toMatchObject({ title: 'Meu título', titleSource: 'leader' });
  });

  it('deve validar o título e responder 404 para responsabilidade inexistente', async () => {
    const created = await authed(app).post(REPORTS).send(newReport);
    const [first] = (await authed(app).get(`${REPORTS}/${created.body.id}/responsibilities`)).body;

    expect(
      (await authed(app).patch(`/api/v1/responsibilities/${first.id}`).send({ title: '   ' }))
        .status,
    ).toBe(400);
    expect(
      (
        await authed(app)
          .patch(`/api/v1/responsibilities/${first.id}`)
          .send({ title: 'x'.repeat(61) })
      ).status,
    ).toBe(400);
    expect((await authed(app).patch(`/api/v1/responsibilities/${first.id}`).send({})).status).toBe(
      400,
    );
    expect(
      (
        await authed(app)
          .patch('/api/v1/responsibilities/018f0000-0000-7000-8000-0000000000ff')
          .send({ title: 'Ok' })
      ).status,
    ).toBe(404);
  });

  it('deve esconder as responsabilidades da pessoa excluída', async () => {
    const created = await authed(app).post(REPORTS).send(newReport);
    const [first] = (await authed(app).get(`${REPORTS}/${created.body.id}/responsibilities`)).body;

    await authed(app).delete(`${REPORTS}/${created.body.id}`);

    expect((await authed(app).get(`${REPORTS}/${created.body.id}/responsibilities`)).status).toBe(
      404,
    );
    expect(
      (await authed(app).patch(`/api/v1/responsibilities/${first.id}`).send({ title: 'Ok' }))
        .status,
    ).toBe(404);
  });
});
