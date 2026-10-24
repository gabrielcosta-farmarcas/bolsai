import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import { authed } from '../../test/auth.js';
import { resetDatabase } from '../../test/reset-database.js';
import { newPersonBody } from '../../test/responsibilities.js';

const createSession = async (directReportId: string, heldOn: string) => {
  const response = await authed(app)
    .post(`/api/v1/direct-reports/${directReportId}/sessions`)
    .send({ heldOn, transcript: `Conversa de ${heldOn}.` });
  return response.body.id as string;
};

const addAnalysisAndAgreement = async (
  directReportId: string,
  sessionId: string,
  description: string,
) => {
  const analysis = await prisma.analysis.create({
    data: {
      leaderId: FIXED_LEADER_ID,
      sessionId,
      status: 'completed',
      rawJson: { private_leader_notes: 'NOTA' },
    },
  });
  await prisma.agreement.create({
    data: {
      leaderId: FIXED_LEADER_ID,
      directReportId,
      originSessionId: sessionId,
      analysisId: analysis.id,
      description,
      owner: 'report',
      origin: 'ai',
    },
  });
};

describe('apagar encontro', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve apagar o encontro, as análises e os combinados dele, e manter os de outro encontro', async () => {
    const report = await authed(app).post('/api/v1/direct-reports').send(newPersonBody());
    const reportId = report.body.id as string;
    const doomed = await createSession(reportId, '2026-10-01');
    const kept = await createSession(reportId, '2026-10-08');
    await addAnalysisAndAgreement(reportId, doomed, 'Combinado apagado');
    await addAnalysisAndAgreement(reportId, kept, 'Combinado mantido');

    const removed = await authed(app).delete(`/api/v1/sessions/${doomed}`);

    expect(removed.status).toBe(204);
    expect((await authed(app).get(`/api/v1/sessions/${doomed}`)).status).toBe(404);
    expect(await prisma.session.count({ where: { id: doomed } })).toBe(0);
    expect(await prisma.analysis.count({ where: { sessionId: doomed } })).toBe(0);
    expect(await prisma.agreement.count({ where: { originSessionId: doomed } })).toBe(0);
    expect(await prisma.session.count({ where: { id: kept } })).toBe(1);
    expect(await prisma.analysis.count({ where: { sessionId: kept } })).toBe(1);
    expect(await prisma.agreement.count({ where: { description: 'Combinado mantido' } })).toBe(1);

    const list = await authed(app).get(`/api/v1/direct-reports/${reportId}/sessions`);
    expect(list.body.map((item: { id: string }) => item.id)).toEqual([kept]);
  });

  it('deve dar 404 ao apagar um encontro que não existe ou já foi apagado', async () => {
    const report = await authed(app).post('/api/v1/direct-reports').send(newPersonBody());
    const sessionId = await createSession(report.body.id, '2026-10-01');

    expect((await authed(app).delete(`/api/v1/sessions/${sessionId}`)).status).toBe(204);
    const again = await authed(app).delete(`/api/v1/sessions/${sessionId}`);

    expect(again.status).toBe(404);
    expect(again.body.error.code).toBe('SESSION_NOT_FOUND');
  });
});
