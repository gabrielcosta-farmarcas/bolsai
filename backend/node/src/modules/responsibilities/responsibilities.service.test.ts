import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeResponsibilitiesService,
  type ResponsibilitiesRepository,
  type ResponsibilityRecord,
} from './responsibilities.service.js';

const user = { leaderId: FIXED_LEADER_ID };

const record = (overrides: Partial<ResponsibilityRecord> = {}): ResponsibilityRecord => ({
  id: 'q1',
  leaderId: FIXED_LEADER_ID,
  directReportId: 'r1',
  position: 1,
  title: 'Atendimento',
  titleSource: 'fallback',
  text: 'Atender os clientes pelos canais da empresa.',
  retired: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const setup = (overrides: Partial<ResponsibilitiesRepository> = {}, reportExists = true) => {
  const repo: ResponsibilitiesRepository = {
    listByReport: vi.fn().mockResolvedValue([record()]),
    findById: vi.fn().mockResolvedValue(record()),
    listAll: vi.fn().mockResolvedValue([record()]),
    updateTitle: vi
      .fn()
      .mockImplementation(async (_leader, id, title) =>
        record({ id, title, titleSource: 'leader' }),
      ),
    setAiTitles: vi.fn(),
    ...overrides,
  };
  const reports = {
    findById: vi
      .fn()
      .mockResolvedValue(reportExists ? { id: 'r1', leaderId: FIXED_LEADER_ID } : null),
  };
  return { repo, reports, service: makeResponsibilitiesService({ repo, reports }) };
};

describe('responsibilities service — list', () => {
  it('deve listar só os campos da tela, sem expor ids da líder', async () => {
    const { service, repo } = setup();

    const result = await service.list(user, 'r1', { includeRetired: false });

    expect(result).toEqual([
      {
        id: 'q1',
        position: 1,
        title: 'Atendimento',
        titleSource: 'fallback',
        text: 'Atender os clientes pelos canais da empresa.',
        retired: false,
      },
    ]);
    expect(repo.listByReport).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1', {
      includeRetired: false,
    });
  });

  it('deve lançar NotFoundError quando a pessoa não existe ou é de outra líder', async () => {
    const { service, repo } = setup({}, false);

    await expect(service.list(user, 'r1', { includeRetired: true })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.listByReport).not.toHaveBeenCalled();
  });
});

describe('responsibilities service — updateTitle', () => {
  it('deve gravar o título como escrito pela líder', async () => {
    const { service, repo } = setup();

    const result = await service.updateTitle(user, 'q1', 'Meu título');

    expect(repo.updateTitle).toHaveBeenCalledWith(FIXED_LEADER_ID, 'q1', 'Meu título');
    expect(result).toMatchObject({ title: 'Meu título', titleSource: 'leader' });
  });

  it('deve negar responsabilidade inexistente ou de outra líder, sem alterar nada', async () => {
    const missing = setup({ findById: vi.fn().mockResolvedValue(null) });
    const foreign = setup({ findById: vi.fn().mockResolvedValue(record({ leaderId: 'outra' })) });

    await expect(missing.service.updateTitle(user, 'q1', 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(foreign.service.updateTitle(user, 'q1', 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(missing.repo.updateTitle).not.toHaveBeenCalled();
    expect(foreign.repo.updateTitle).not.toHaveBeenCalled();
  });
});
