import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeResponsibilityMapsService,
  type MapRecord,
  type ResponsibilityMapsRepository,
} from './responsibility-maps.service.js';

const user = { leaderId: FIXED_LEADER_ID };
const three = ['Atender os clientes', 'Registrar no CRM', 'Validar as entregas'];

const mapRecord = (overrides: Partial<MapRecord> = {}): MapRecord => ({
  id: 'm1',
  leaderId: FIXED_LEADER_ID,
  directReportId: 'r1',
  version: 1,
  text: 'RESPONSABILIDADES\n1. Atender os clientes',
  mission: null,
  responsibilities: '1. Atender os clientes',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const setup = (overrides: Partial<ResponsibilityMapsRepository> = {}, reportExists = true) => {
  const repo: ResponsibilityMapsRepository = {
    createNextVersion: vi.fn().mockResolvedValue(mapRecord()),
    listByReport: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    findCurrent: vi.fn(),
    ...overrides,
  };
  const reports = {
    findById: vi
      .fn()
      .mockResolvedValue(reportExists ? { id: 'r1', leaderId: FIXED_LEADER_ID } : null),
  };
  const extract = vi.fn();
  const titles = { suggestForReport: vi.fn() };
  const service = makeResponsibilityMapsService({ repo, reports, extract, titles });
  return { repo, reports, extract, titles, service };
};

describe('responsibility maps service — createVersion', () => {
  it('deve criar a próxima versão com o texto composto, as responsabilidades e a missão', async () => {
    const { repo, service } = setup();

    await service.createVersion(user, 'r1', {
      mission: ' Missão do cargo ',
      responsibilities: three,
    });

    expect(repo.createNextVersion).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1', {
      text: 'MISSÃO / FINALIDADE DO CARGO\nMissão do cargo\n\nRESPONSABILIDADES\n1. Atender os clientes\n2. Registrar no CRM\n3. Validar as entregas',
      mission: 'Missão do cargo',
      responsibilities: '1. Atender os clientes\n2. Registrar no CRM\n3. Validar as entregas',
      items: [
        { text: 'Atender os clientes', key: 'atender os clientes' },
        { text: 'Registrar no CRM', key: 'registrar no crm' },
        { text: 'Validar as entregas', key: 'validar as entregas' },
      ],
    });
  });

  it('deve recusar menos de 3 e não criar versão', async () => {
    const { repo, service } = setup();

    await expect(
      service.createVersion(user, 'r1', { responsibilities: ['Atender os clientes', ''] }),
    ).rejects.toMatchObject({ statusCode: 422, code: 'TOO_FEW_RESPONSIBILITIES' });
    expect(repo.createNextVersion).not.toHaveBeenCalled();
  });

  it('deve recusar mais de 10', async () => {
    const { repo, service } = setup();
    const eleven = Array.from({ length: 11 }, (_, index) => `Responsabilidade ${index + 1}`);

    await expect(
      service.createVersion(user, 'r1', { responsibilities: eleven }),
    ).rejects.toMatchObject({
      code: 'TOO_MANY_RESPONSIBILITIES',
    });
    expect(repo.createNextVersion).not.toHaveBeenCalled();
  });

  it('deve avisar quantos repetidos foram juntados', async () => {
    const { service } = setup();

    const result = await service.createVersion(user, 'r1', {
      responsibilities: [...three, 'ATENDER os  clientes'],
    });

    expect(result.duplicates).toBe(1);
  });

  it('deve pedir os títulos da IA depois de salvar, sem depender dela', async () => {
    const { titles, service } = setup();

    await service.createVersion(user, 'r1', { responsibilities: three });

    expect(titles.suggestForReport).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1');
  });

  it('deve lançar NotFoundError quando o liderado não existe ou foi excluído', async () => {
    const { service, repo } = setup({}, false);

    await expect(
      service.createVersion(user, 'r1', { responsibilities: three }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.createNextVersion).not.toHaveBeenCalled();
  });
});

describe('responsibility maps service — extractProposal', () => {
  it('deve devolver só uma proposta, sem salvar nada', async () => {
    const { repo, extract, service } = setup();
    extract.mockResolvedValue({
      text: 'Atender os clientes pelos canais.\n\nRegistrar tudo no CRM.\n\nValidar as entregas.',
      fileType: 'pdf',
    });

    const proposal = await service.extractProposal({
      fileName: 'cargo.pdf',
      buffer: Buffer.from('x'),
    });

    expect(proposal.responsibilities).toEqual([
      'Atender os clientes pelos canais.',
      'Registrar tudo no CRM.',
      'Validar as entregas.',
    ]);
    expect(repo.createNextVersion).not.toHaveBeenCalled();
    expect(extract).toHaveBeenCalledWith(expect.any(Buffer), 'cargo.pdf');
  });
});

describe('responsibility maps service — list e getById', () => {
  it('deve marcar a versão mais alta como vigente na listagem', async () => {
    const { service } = setup({
      listByReport: vi.fn().mockResolvedValue([mapRecord({ id: 'm2', version: 2 }), mapRecord()]),
    });

    const list = await service.list(user, 'r1');

    expect(list.map((item) => [item.version, item.isCurrent])).toEqual([
      [2, true],
      [1, false],
    ]);
  });

  it('deve lançar NotFoundError ao abrir versão inexistente', async () => {
    const { service } = setup({ findById: vi.fn().mockResolvedValue(null) });

    await expect(service.getById(user, 'x')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deve negar versão de outra líder', async () => {
    const { service } = setup({
      findById: vi.fn().mockResolvedValue(mapRecord({ leaderId: 'outra-lider' })),
    });

    await expect(service.getById(user, 'm1')).rejects.toBeInstanceOf(NotFoundError);
  });
});
