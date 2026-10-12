import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeAgreementsService,
  type AgreementRecord,
  type AgreementsRepository,
} from './agreements.service.js';

const user = { leaderId: FIXED_LEADER_ID };
const NOW = new Date('2026-10-05T15:00:00.000Z');

const record = (overrides: Partial<AgreementRecord> = {}): AgreementRecord => ({
  id: 'g1',
  leaderId: FIXED_LEADER_ID,
  directReportId: 'r1',
  directReportName: 'Ana Beatriz Moura',
  originSessionId: 's1',
  analysisId: 'a1',
  description: 'Enviar a proposta',
  owner: 'report',
  dueDate: new Date('2026-10-02T00:00:00.000Z'),
  status: 'open',
  evidenceExcerpt: 'Eu mando.',
  origin: 'ai',
  confirmedAt: null,
  closedAt: null,
  createdAt: new Date('2026-10-01T12:00:00.000Z'),
  ...overrides,
});

const setup = (reportExists = true) => {
  const repo: AgreementsRepository = {
    list: vi.fn().mockResolvedValue({ data: [record()], total: 1 }),
    listByReport: vi.fn().mockResolvedValue([record()]),
    listBySession: vi.fn().mockResolvedValue([record()]),
    findById: vi.fn().mockResolvedValue(record()),
    create: vi.fn().mockResolvedValue(record({ origin: 'leader' })),
    update: vi.fn().mockImplementation(async (_leaderId: string, id: string) => record({ id })),
    listOpen: vi.fn().mockResolvedValue([]),
  };
  const reports = {
    findById: vi
      .fn()
      .mockResolvedValue(reportExists ? { id: 'r1', leaderId: FIXED_LEADER_ID } : null),
  };
  const sessions = {
    findById: vi.fn().mockResolvedValue({ id: 's1', directReportId: 'r1' }),
  };
  const service = makeAgreementsService({ repo, reports, sessions, now: () => NOW });
  return { repo, reports, sessions, service };
};

describe('agreements service — leitura', () => {
  it('deve marcar como atrasado o combinado aberto com prazo vencido e dizer se é da IA', async () => {
    const { service } = setup();

    const [dto] = await service.listByReport(user, 'r1');

    expect(dto).toMatchObject({
      isOverdue: true,
      dueDate: '2026-10-02',
      isConfirmed: false,
      origin: 'ai',
    });
  });

  it('não deve marcar atrasado o combinado concluído', async () => {
    const { service, repo } = setup();
    vi.mocked(repo.listByReport).mockResolvedValue([record({ status: 'done' })]);

    expect((await service.listByReport(user, 'r1'))[0]?.isOverdue).toBe(false);
  });

  it('deve traduzir o filtro "overdue" em aberto com prazo anterior a hoje (dia de São Paulo)', async () => {
    const { service, repo } = setup();

    await service.list(user, { status: 'overdue' });

    expect(repo.list).toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      { directReportId: undefined, status: 'open', overdueBefore: '2026-10-05' },
      { skip: 0, take: 20 },
    );
  });

  it('deve lançar NotFoundError quando o liderado não existe ou foi excluído', async () => {
    const { service } = setup(false);

    await expect(service.listByReport(user, 'r1')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('agreements service — criar e editar', () => {
  it('deve criar à mão já confirmado e sem prazo quando não informado', async () => {
    const { service, repo } = setup();

    await service.create(user, 'r1', { description: 'Marcar a revisão', owner: 'leader' });

    expect(repo.create).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1', {
      description: 'Marcar a revisão',
      owner: 'leader',
      dueDate: null,
      originSessionId: null,
      confirmedAt: NOW,
    });
  });

  it('deve recusar sessão de outro liderado ao criar', async () => {
    const { service, sessions, repo } = setup();
    vi.mocked(sessions.findById).mockResolvedValue({ id: 's9', directReportId: 'outro' });

    await expect(
      service.create(user, 'r1', { description: 'x', owner: 'leader', sessionId: 's9' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve confirmar o combinado da IA ao editar e fechar com data ao concluir', async () => {
    const { service, repo } = setup();

    await service.update(user, 'g1', { status: 'done' });

    expect(repo.update).toHaveBeenCalledWith(FIXED_LEADER_ID, 'g1', {
      confirmedAt: NOW,
      status: 'done',
      closedAt: NOW,
    });
  });

  it('deve limpar a data de fechamento ao reabrir e manter a confirmação anterior', async () => {
    const { service, repo } = setup();
    const confirmedAt = new Date('2026-10-03T10:00:00.000Z');
    vi.mocked(repo.findById).mockResolvedValue(
      record({ status: 'done', confirmedAt, closedAt: NOW }),
    );

    await service.update(user, 'g1', { status: 'open', dueDate: null });

    expect(repo.update).toHaveBeenCalledWith(FIXED_LEADER_ID, 'g1', {
      confirmedAt,
      status: 'open',
      closedAt: null,
      dueDate: null,
    });
  });

  it('deve lançar NotFoundError ao editar combinado inexistente', async () => {
    const { service, repo } = setup();
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(service.update(user, 'x', { status: 'done' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
