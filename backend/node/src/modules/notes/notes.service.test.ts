import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeNotesService,
  type NoteRecord,
  type NotesRepository,
  type NoteAgreementRecord,
} from './notes.service.js';

const user = { leaderId: FIXED_LEADER_ID };
const NOW = new Date('2026-10-05T15:00:00.000Z');

const agreement = (overrides: Partial<NoteAgreementRecord> = {}): NoteAgreementRecord => ({
  id: 'g1',
  description: 'Conversar sobre o que travou',
  owner: 'leader',
  dueDate: null,
  status: 'open',
  ...overrides,
});

const note = (overrides: Partial<NoteRecord> = {}): NoteRecord => ({
  id: 'n1',
  leaderId: FIXED_LEADER_ID,
  directReportId: 'r1',
  kind: 'agreement_missed',
  description: 'Relatório não entregue',
  notedAt: new Date('2026-10-01T00:00:00.000Z'),
  resolvedAt: null,
  bringToNextSession: false,
  createdAt: new Date('2026-10-01T12:00:00.000Z'),
  agreements: [],
  ...overrides,
});

const setup = (current: NoteRecord = note(), reportExists = true) => {
  const repo: NotesRepository = {
    listByReport: vi.fn().mockResolvedValue([current]),
    findById: vi.fn().mockResolvedValue(current),
    create: vi.fn().mockResolvedValue(current),
    update: vi.fn().mockResolvedValue(current),
    remove: vi.fn().mockResolvedValue(undefined),
    addAgreement: vi.fn().mockResolvedValue(current),
  };
  const reports = {
    findById: vi
      .fn()
      .mockResolvedValue(reportExists ? { id: 'r1', leaderId: FIXED_LEADER_ID } : null),
  };
  return { repo, service: makeNotesService({ repo, reports, now: () => NOW }) };
};

describe('notes service', () => {
  it('lista com contagens por situação e filtra', async () => {
    const records = [
      note({ id: 'a' }),
      note({ id: 'b', agreements: [agreement()] }),
      note({ id: 'c', resolvedAt: NOW }),
    ];
    const { repo, service } = setup();
    repo.listByReport = vi.fn().mockResolvedValue(records);

    const all = await service.list(user, 'r1', {});
    expect(all.counts).toEqual({ all: 3, open: 2, resolved: 1 });
    const resolved = await service.list(user, 'r1', { status: 'resolved' });
    expect(resolved.data.map((n) => n.id)).toEqual(['c']);
  });

  it('lista da mais recente para a mais antiga', async () => {
    const { repo, service } = setup();
    repo.listByReport = vi
      .fn()
      .mockResolvedValue([
        note({ id: 'velha', notedAt: new Date('2026-09-01T00:00:00.000Z') }),
        note({ id: 'nova', notedAt: new Date('2026-10-03T00:00:00.000Z') }),
      ]);
    const { data } = await service.list(user, 'r1', {});
    expect(data.map((n) => n.id)).toEqual(['nova', 'velha']);
  });

  it('responde 404 quando a pessoa não existe', async () => {
    const { service } = setup(note(), false);
    await expect(service.list(user, 'r1', {})).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      service.create(user, 'r1', { kind: 'praise', description: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('cria com a data de hoje quando não vem data', async () => {
    const { repo, service } = setup();
    await service.create(user, 'r1', { kind: 'attention', description: 'Algo' });
    expect(repo.create).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1', {
      kind: 'attention',
      description: 'Algo',
      notedAt: new Date('2026-10-05T00:00:00.000Z'),
    });
  });

  it('mostra os combinados da anotação, marca atraso e esconde cancelados', async () => {
    const { service } = setup(
      note({
        agreements: [
          agreement({ id: 'g1', dueDate: new Date('2026-10-01T00:00:00.000Z') }),
          agreement({ id: 'g2', dueDate: new Date('2026-10-10T00:00:00.000Z') }),
          agreement({ id: 'g3', status: 'done', dueDate: new Date('2026-10-01T00:00:00.000Z') }),
          agreement({ id: 'g4', status: 'cancelled' }),
        ],
      }),
    );
    const { data } = await service.list(user, 'r1', {});
    const dto = data[0]!;
    expect(dto.agreements.map((a) => a.id)).toEqual(['g1', 'g2', 'g3']);
    expect(dto.agreements.map((a) => a.isOverdue)).toEqual([true, false, false]);
    expect(dto.status).toBe('open');
  });

  it('resolver grava a data e tira o lembrete do próximo encontro', async () => {
    const { repo, service } = setup(note({ bringToNextSession: true }));
    await service.update(user, 'n1', { resolved: true });
    expect(repo.update).toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      'n1',
      expect.objectContaining({ resolvedAt: NOW, bringToNextSession: false }),
    );
  });

  it('reabrir limpa a data de resolvida', async () => {
    const { repo, service } = setup(note({ resolvedAt: NOW }));
    await service.update(user, 'n1', { resolved: false });
    expect(repo.update).toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      'n1',
      expect.objectContaining({ resolvedAt: null }),
    );
  });

  it('marcar para o próximo encontro mantém o resto', async () => {
    const { repo, service } = setup();
    await service.update(user, 'n1', { bringToNextSession: true });
    expect(repo.update).toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      'n1',
      expect.objectContaining({ resolvedAt: null, bringToNextSession: true }),
    );
  });

  it('lista só as anotações marcadas e não resolvidas para o próximo encontro', async () => {
    const { repo, service } = setup();
    repo.listByReport = vi
      .fn()
      .mockResolvedValue([
        note({ id: 'a', bringToNextSession: true }),
        note({ id: 'b', bringToNextSession: false }),
        note({ id: 'c', bringToNextSession: true, resolvedAt: NOW }),
      ]);
    expect((await service.listForNextSession(user, 'r1')).map((n) => n.id)).toEqual(['a']);
  });

  it('cria o combinado ligado à anotação', async () => {
    const { repo, service } = setup();
    await service.addAgreement(user, 'n1', {
      description: 'Enviar o relatório',
      owner: 'report',
      dueDate: '2026-10-20',
    });
    expect(repo.addAgreement).toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      'n1',
      {
        description: 'Enviar o relatório',
        owner: 'report',
        dueDate: new Date('2026-10-20T00:00:00.000Z'),
      },
      NOW,
    );
  });

  it('não cria combinado em anotação que não é da líder', async () => {
    const { repo, service } = setup();
    repo.findById = vi.fn().mockResolvedValue(null);
    await expect(
      service.addAgreement(user, 'x', { description: 'a', owner: 'leader' }),
    ).rejects.toMatchObject({ code: 'NOTE_NOT_FOUND' });
  });

  it('exclui a anotação com a data de agora', async () => {
    const { repo, service } = setup();
    await service.remove(user, 'n1');
    expect(repo.remove).toHaveBeenCalledWith(FIXED_LEADER_ID, 'n1', NOW);
  });

  it('responde 404 quando a anotação não existe', async () => {
    const { repo, service } = setup();
    repo.findById = vi.fn().mockResolvedValue(null);
    await expect(service.update(user, 'x', { resolved: true })).rejects.toMatchObject({
      code: 'NOTE_NOT_FOUND',
    });
  });
});
