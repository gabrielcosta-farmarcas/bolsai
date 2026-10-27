import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../../shared/database/prisma.js';
import { authed } from '../../test/auth.js';
import { resetDatabase } from '../../test/reset-database.js';
import { newPersonBody } from '../../test/responsibilities.js';

const API = '/api/v1';
const app = createApp();

const createReport = async () =>
  (
    await authed(app)
      .post(`${API}/direct-reports`)
      .send(newPersonBody({ name: 'Luzinaldo', role: 'Coordenador', startedAt: '2025-01-20' }))
  ).body.id as string;

const createNote = async (reportId: string, description = 'Esqueceu o que pedi') =>
  (
    await authed(app)
      .post(`${API}/direct-reports/${reportId}/notes`)
      .send({ kind: 'agreement_missed', description, notedAt: '2026-10-26' })
  ).body as { id: string; status: string };

describe('notes', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('cria, lista com contagens e filtra por situação', async () => {
    const report = await createReport();
    const first = await createNote(report, 'Primeira');
    await createNote(report, 'Segunda');
    expect(first.status).toBe('no_plan');

    await authed(app).post(`${API}/notes/${first.id}/steps`).send({ text: 'Conversar' });

    const all = await authed(app).get(`${API}/direct-reports/${report}/notes`);
    expect(all.status).toBe(200);
    expect(all.body.counts).toEqual({ all: 2, no_plan: 1, in_progress: 1, resolved: 0 });

    const inProgress = await authed(app).get(
      `${API}/direct-reports/${report}/notes?status=in_progress`,
    );
    expect(inProgress.body.data.map((n: { id: string }) => n.id)).toEqual([first.id]);
  });

  it('valida descrição vazia, longa demais e data inválida', async () => {
    const report = await createReport();
    const post = (body: object) =>
      authed(app).post(`${API}/direct-reports/${report}/notes`).send(body);

    expect((await post({ kind: 'praise', description: '   ' })).status).toBe(400);
    expect((await post({ kind: 'praise', description: 'a'.repeat(2001) })).status).toBe(400);
    expect((await post({ kind: 'nada', description: 'x' })).status).toBe(400);
    expect((await post({ kind: 'praise', description: 'x', notedAt: '26/10' })).status).toBe(400);
  });

  it('edita, resolve, reabre e exclui', async () => {
    const report = await createReport();
    const note = await createNote(report);

    const edited = await authed(app)
      .patch(`${API}/notes/${note.id}`)
      .send({ description: 'Texto novo', kind: 'attention' });
    expect(edited.body.description).toBe('Texto novo');
    expect(edited.body.kind).toBe('attention');

    const resolved = await authed(app).patch(`${API}/notes/${note.id}`).send({ resolved: true });
    expect(resolved.body.status).toBe('resolved');
    const reopened = await authed(app).patch(`${API}/notes/${note.id}`).send({ resolved: false });
    expect(reopened.body.status).toBe('no_plan');

    expect((await authed(app).delete(`${API}/notes/${note.id}`)).status).toBe(204);
    const list = await authed(app).get(`${API}/direct-reports/${report}/notes`);
    expect(list.body.data).toEqual([]);
    expect(
      (await authed(app).patch(`${API}/notes/${note.id}`).send({ resolved: true })).status,
    ).toBe(404);
  });

  it('monta o plano: passos, progresso, atraso, edição e remoção', async () => {
    const report = await createReport();
    const note = await createNote(report);
    const add = (body: object) => authed(app).post(`${API}/notes/${note.id}/steps`).send(body);

    await add({ text: 'Conversar', dueDate: '2020-01-01' });
    await add({ text: 'Combinar prazo', owner: 'report' });
    const third = await add({ text: 'Revisitar' });
    expect(third.body.status).toBe('in_progress');
    expect(third.body.steps.map((s: { position: number }) => s.position)).toEqual([1, 2, 3]);
    expect(third.body.steps[0].isOverdue).toBe(true);
    expect(third.body.steps[1].owner).toBe('report');

    const stepId = third.body.steps[0].id as string;
    const done = await authed(app)
      .patch(`${API}/notes/${note.id}/steps/${stepId}`)
      .send({ done: true });
    expect(done.body.progress).toEqual({ done: 1, total: 3 });
    expect(done.body.steps[0].isOverdue).toBe(false);

    const removed = await authed(app).delete(`${API}/notes/${note.id}/steps/${stepId}`);
    expect(removed.body.steps).toHaveLength(2);

    for (const step of removed.body.steps as Array<{ id: string }>)
      await authed(app).delete(`${API}/notes/${note.id}/steps/${step.id}`);
    const empty = await authed(app).get(`${API}/direct-reports/${report}/notes`);
    expect(empty.body.data[0].status).toBe('no_plan');
  });

  it('promove o passo a Combinado sem duplicar', async () => {
    const report = await createReport();
    const note = await createNote(report);
    const added = await authed(app)
      .post(`${API}/notes/${note.id}/steps`)
      .send({ text: 'Entregar o relatório', dueDate: '2026-10-30', owner: 'report' });
    const stepId = added.body.steps[0].id as string;

    const first = await authed(app).post(`${API}/notes/${note.id}/steps/${stepId}/agreement`);
    expect(first.status).toBe(200);
    expect(first.body.steps[0].agreementId).toBeTruthy();
    const second = await authed(app).post(`${API}/notes/${note.id}/steps/${stepId}/agreement`);
    expect(second.body.steps[0].agreementId).toBe(first.body.steps[0].agreementId);

    const agreements = await authed(app).get(`${API}/direct-reports/${report}/agreements`);
    expect(agreements.body).toHaveLength(1);
    expect(agreements.body[0]).toMatchObject({
      description: 'Entregar o relatório',
      owner: 'report',
      dueDate: '2026-10-30',
      origin: 'leader',
    });
  });

  it('lista para o próximo encontro só as marcadas e não resolvidas', async () => {
    const report = await createReport();
    const a = await createNote(report, 'A');
    const b = await createNote(report, 'B');
    await authed(app).patch(`${API}/notes/${a.id}`).send({ bringToNextSession: true });
    await authed(app).patch(`${API}/notes/${b.id}`).send({ bringToNextSession: true });

    const before = await authed(app).get(`${API}/direct-reports/${report}/notes/for-next-session`);
    expect(before.body.map((n: { id: string }) => n.id).sort()).toEqual([a.id, b.id].sort());

    await authed(app).patch(`${API}/notes/${b.id}`).send({ resolved: true });
    const after = await authed(app).get(`${API}/direct-reports/${report}/notes/for-next-session`);
    expect(after.body.map((n: { id: string }) => n.id)).toEqual([a.id]);
  });

  it('esconde as anotações de uma pessoa excluída', async () => {
    const report = await createReport();
    const note = await createNote(report);
    await authed(app).delete(`${API}/direct-reports/${report}`);
    expect(
      (await authed(app).patch(`${API}/notes/${note.id}`).send({ resolved: true })).status,
    ).toBe(404);
  });
});
