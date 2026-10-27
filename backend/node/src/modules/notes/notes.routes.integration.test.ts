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
    expect(first.status).toBe('open');

    await authed(app).patch(`${API}/notes/${first.id}`).send({ resolved: true });

    const all = await authed(app).get(`${API}/direct-reports/${report}/notes`);
    expect(all.status).toBe(200);
    expect(all.body.counts).toEqual({ all: 2, open: 1, resolved: 1 });

    const resolved = await authed(app).get(`${API}/direct-reports/${report}/notes?status=resolved`);
    expect(resolved.body.data.map((n: { id: string }) => n.id)).toEqual([first.id]);
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
    expect(reopened.body.status).toBe('open');

    expect((await authed(app).delete(`${API}/notes/${note.id}`)).status).toBe(204);
    const list = await authed(app).get(`${API}/direct-reports/${report}/notes`);
    expect(list.body.data).toEqual([]);
    expect(
      (await authed(app).patch(`${API}/notes/${note.id}`).send({ resolved: true })).status,
    ).toBe(404);
  });

  it('cria combinados a partir da anotação e eles aparecem em Combinados', async () => {
    const report = await createReport();
    const note = await createNote(report);
    const add = (body: object) => authed(app).post(`${API}/notes/${note.id}/agreements`).send(body);

    const first = await add({
      description: 'Entregar o relatório',
      owner: 'report',
      dueDate: '2020-01-01',
    });
    expect(first.status).toBe(201);
    expect(first.body.agreements).toHaveLength(1);
    expect(first.body.agreements[0]).toMatchObject({
      description: 'Entregar o relatório',
      owner: 'report',
      dueDate: '2020-01-01',
      status: 'open',
      isOverdue: true,
    });
    await add({ description: 'Rever a ferramenta', owner: 'leader' });

    expect((await add({ description: '   ', owner: 'leader' })).status).toBe(400);
    expect((await add({ description: 'x', owner: 'outro' })).status).toBe(400);

    const agreements = await authed(app).get(`${API}/direct-reports/${report}/agreements`);
    expect(agreements.body).toHaveLength(2);
    expect(agreements.body[0]).toMatchObject({ origin: 'leader', status: 'open' });

    // Fechar pelo Combinado reflete na anotação; cancelar tira da anotação.
    const [one, two] = agreements.body as Array<{ id: string; description: string }>;
    await authed(app).patch(`${API}/agreements/${one!.id}`).send({ status: 'done' });
    await authed(app).patch(`${API}/agreements/${two!.id}`).send({ status: 'cancelled' });
    const list = await authed(app).get(`${API}/direct-reports/${report}/notes`);
    expect(list.body.data[0].agreements).toHaveLength(1);
    expect(list.body.data[0].agreements[0]).toMatchObject({ status: 'done', isOverdue: false });
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
