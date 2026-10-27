import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeNotesService,
  type NoteRecord,
  type NotesRepository,
  type StepRecord,
} from './notes.service.js';

const user = { leaderId: FIXED_LEADER_ID };
const NOW = new Date('2026-10-05T15:00:00.000Z');

const step = (overrides: Partial<StepRecord> = {}): StepRecord => ({
  id: 's1',
  position: 1,
  text: 'Conversar sobre o que travou',
  dueDate: null,
  owner: 'leader',
  doneAt: null,
  agreementId: null,
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
  steps: [],
  ...overrides,
});

const setup = (current: NoteRecord = note(), reportExists = true) => {
  const repo: NotesRepository = {
    listByReport: vi.fn().mockResolvedValue([current]),
    findById: vi.fn().mockResolvedValue(current),
    create: vi.fn().mockResolvedValue(current),
    update: vi.fn().mockResolvedValue(current),
    remove: vi.fn().mockResolvedValue(undefined),
    addStep: vi.fn().mockResolvedValue(current),
    updateStep: vi.fn().mockResolvedValue(current),
    removeStep: vi.fn().mockResolvedValue(current),
    promoteStep: vi.fn().mockResolvedValue(current),
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
      note({ id: 'b', steps: [step()] }),
      note({ id: 'c', resolvedAt: NOW }),
    ];
    const { repo, service } = setup();
    repo.listByReport = vi.fn().mockResolvedValue(records);

    const all = await service.list(user, 'r1', {});
    expect(all.counts).toEqual({ all: 3, no_plan: 1, in_progress: 1, resolved: 1 });
    const open = await service.list(user, 'r1', { status: 'in_progress' });
    expect(open.data.map((n) => n.id)).toEqual(['b']);
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

  it('calcula progresso, ordem e atraso dos passos', async () => {
    const { service } = setup(
      note({
        steps: [
          step({ id: 's2', position: 2, dueDate: new Date('2026-10-10T00:00:00.000Z') }),
          step({ id: 's1', position: 1, dueDate: new Date('2026-10-01T00:00:00.000Z') }),
          step({
            id: 's3',
            position: 3,
            doneAt: NOW,
            dueDate: new Date('2026-10-01T00:00:00.000Z'),
          }),
        ],
      }),
    );
    const { data } = await service.list(user, 'r1', {});
    const dto = data[0]!;
    expect(dto.steps.map((s) => s.id)).toEqual(['s1', 's2', 's3']);
    expect(dto.steps.map((s) => s.isOverdue)).toEqual([true, false, false]);
    expect(dto.progress).toEqual({ done: 1, total: 3 });
    expect(dto.status).toBe('in_progress');
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

  it('adiciona passo com responsável padrão a líder', async () => {
    const { repo, service } = setup();
    await service.addStep(user, 'n1', { text: 'Novo passo', dueDate: '2026-10-20' });
    expect(repo.addStep).toHaveBeenCalledWith(FIXED_LEADER_ID, 'n1', {
      text: 'Novo passo',
      dueDate: new Date('2026-10-20T00:00:00.000Z'),
      owner: 'leader',
    });
  });

  it('marcar feito grava a data; desmarcar limpa; refazer não muda a data original', async () => {
    const done = new Date('2026-10-02T10:00:00.000Z');
    const { repo, service } = setup(note({ steps: [step({ doneAt: done })] }));
    await service.updateStep(user, 'n1', 's1', { done: true });
    expect(repo.updateStep).toHaveBeenLastCalledWith(FIXED_LEADER_ID, 'n1', 's1', {
      doneAt: done,
    });
    await service.updateStep(user, 'n1', 's1', { done: false });
    expect(repo.updateStep).toHaveBeenLastCalledWith(FIXED_LEADER_ID, 'n1', 's1', {
      doneAt: null,
    });
  });

  it('responde 404 para passo que não é da anotação', async () => {
    const { service } = setup();
    await expect(service.updateStep(user, 'n1', 'outro', { done: true })).rejects.toMatchObject({
      code: 'STEP_NOT_FOUND',
    });
  });

  it('promove o passo a Combinado e não promove duas vezes', async () => {
    const { repo, service } = setup(note({ steps: [step()] }));
    await service.promoteStep(user, 'n1', 's1');
    expect(repo.promoteStep).toHaveBeenCalledTimes(1);

    const already = setup(note({ steps: [step({ agreementId: 'g1' })] }));
    const dto = await already.service.promoteStep(user, 'n1', 's1');
    expect(already.repo.promoteStep).not.toHaveBeenCalled();
    expect(dto.steps[0]?.agreementId).toBe('g1');
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
