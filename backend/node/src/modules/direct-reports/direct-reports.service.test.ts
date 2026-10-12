import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeDirectReportsService,
  type DirectReportRecord,
  type DirectReportsRepository,
} from './direct-reports.service.js';

const user = { leaderId: FIXED_LEADER_ID };

const record = (overrides: Partial<DirectReportRecord> = {}): DirectReportRecord => ({
  id: 'r1',
  leaderId: FIXED_LEADER_ID,
  name: 'Ana Souza',
  role: 'Analista',
  startedAt: new Date('2025-03-10T00:00:00.000Z'),
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastSessionOn: new Date('2026-10-01T00:00:00.000Z'),
  openAgreements: 2,
  ...overrides,
});

const makeRepo = (overrides: Partial<DirectReportsRepository> = {}): DirectReportsRepository => ({
  list: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  ...overrides,
});

describe('makeDirectReportsService.list', () => {
  it('deve devolver a página com datas no formato AAAA-MM-DD', async () => {
    const repo = makeRepo({ list: vi.fn().mockResolvedValue({ data: [record()], total: 1 }) });

    const result = await makeDirectReportsService(repo).list(user, { page: 1, pageSize: 20 });

    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(result.data[0]).toMatchObject({
      id: 'r1',
      startedAt: '2025-03-10',
      status: 'active',
      lastSessionOn: '2026-10-01',
      openAgreements: 2,
    });
    expect(repo.list).toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      { status: undefined },
      { skip: 0, take: 20 },
    );
  });

  it('deve repassar o filtro de status', async () => {
    const repo = makeRepo({ list: vi.fn().mockResolvedValue({ data: [], total: 0 }) });

    await makeDirectReportsService(repo).list(user, { page: 2, pageSize: 10, status: 'inactive' });

    expect(repo.list).toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      { status: 'inactive' },
      { skip: 10, take: 10 },
    );
  });
});

describe('makeDirectReportsService.getById', () => {
  it('deve lançar NotFoundError quando o liderado não existe ou foi excluído', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) });

    await expect(makeDirectReportsService(repo).getById(user, 'x')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

const person = {
  name: 'Ana Souza',
  role: 'Analista',
  startedAt: '2025-03-10',
};

describe('makeDirectReportsService.create', () => {
  it('deve criar a pessoa com o responsograma e as responsabilidades (a chave ignora maiúsculas e espaços)', async () => {
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(record()) });

    const result = await makeDirectReportsService(repo).create(user, {
      ...person,
      mission: ' Garantir o sucesso do cliente ',
      responsibilities: ['Atender os clientes', '  Registrar   no CRM ', 'Validar as entregas'],
    });

    expect(repo.create).toHaveBeenCalledWith(FIXED_LEADER_ID, {
      ...person,
      status: 'active',
      initialMap: {
        mission: 'Garantir o sucesso do cliente',
        responsibilities: '1. Atender os clientes\n2. Registrar no CRM\n3. Validar as entregas',
        text: 'MISSÃO / FINALIDADE DO CARGO\nGarantir o sucesso do cliente\n\nRESPONSABILIDADES\n1. Atender os clientes\n2. Registrar no CRM\n3. Validar as entregas',
        items: [
          { text: 'Atender os clientes', key: 'atender os clientes' },
          { text: 'Registrar no CRM', key: 'registrar no crm' },
          { text: 'Validar as entregas', key: 'validar as entregas' },
        ],
      },
    });
    expect(result.id).toBe('r1');
  });

  it('deve funcionar sem missão', async () => {
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(record()) });

    await makeDirectReportsService(repo).create(user, {
      ...person,
      responsibilities: ['Atender os clientes', 'Registrar no CRM', 'Validar as entregas'],
    });

    const sent = vi.mocked(repo.create).mock.calls[0]?.[1];
    expect(sent?.initialMap.mission).toBeNull();
    expect(sent?.initialMap.text.startsWith('RESPONSABILIDADES')).toBe(true);
  });

  it('não deve criar a pessoa com menos de 3 responsabilidades', async () => {
    const repo = makeRepo({ create: vi.fn() });

    await expect(
      makeDirectReportsService(repo).create(user, {
        ...person,
        responsibilities: ['Atender os clientes', 'Registrar no CRM'],
      }),
    ).rejects.toMatchObject({ statusCode: 422, code: 'TOO_FEW_RESPONSIBILITIES' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve pedir os títulos da IA depois de criar, sem depender dela', async () => {
    const repo = makeRepo({ create: vi.fn().mockResolvedValue(record()) });
    const titles = { suggestForReport: vi.fn() };

    await makeDirectReportsService(repo, titles).create(user, {
      ...person,
      responsibilities: ['Atender os clientes', 'Registrar no CRM', 'Validar as entregas'],
    });

    expect(titles.suggestForReport).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1');
  });
});

describe('makeDirectReportsService.update', () => {
  it('deve lançar NotFoundError e não atualizar quando não existe', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null), update: vi.fn() });

    await expect(
      makeDirectReportsService(repo).update(user, 'x', { role: 'Líder' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('deve inativar o liderado', async () => {
    const repo = makeRepo({
      findById: vi.fn().mockResolvedValue(record()),
      update: vi.fn().mockResolvedValue(record({ status: 'inactive' })),
    });

    const result = await makeDirectReportsService(repo).update(user, 'r1', { status: 'inactive' });

    expect(repo.update).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1', { status: 'inactive' });
    expect(result.status).toBe('inactive');
  });
});

describe('makeDirectReportsService.remove', () => {
  it('deve fazer exclusão lógica do liderado existente', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(record()), softDelete: vi.fn() });

    await makeDirectReportsService(repo).remove(user, 'r1');

    expect(repo.softDelete).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1');
  });

  it('deve lançar NotFoundError quando já foi excluído', async () => {
    const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null), softDelete: vi.fn() });

    await expect(makeDirectReportsService(repo).remove(user, 'r1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.softDelete).not.toHaveBeenCalled();
  });
});
