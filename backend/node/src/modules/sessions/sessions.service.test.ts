import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  makeSessionsService,
  type SessionRecord,
  type SessionsRepository,
} from './sessions.service.js';

const user = { leaderId: FIXED_LEADER_ID };

const record = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
  id: 's1',
  leaderId: FIXED_LEADER_ID,
  directReportId: 'r1',
  heldOn: new Date('2026-10-01T00:00:00.000Z'),
  transcript: 'Marina: Oi!',
  status: 'draft',
  summaryExportedAt: null,
  createdAt: new Date('2026-10-02T10:00:00.000Z'),
  ...overrides,
});

const setup = (reportExists = true) => {
  const repo: SessionsRepository = {
    create: vi.fn().mockResolvedValue(record()),
    listByReport: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(record()),
    update: vi.fn().mockResolvedValue(record()),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  const reports = {
    findById: vi
      .fn()
      .mockResolvedValue(reportExists ? { id: 'r1', leaderId: FIXED_LEADER_ID } : null),
  };
  const parse = vi.fn().mockResolvedValue('Texto do arquivo');
  const service = makeSessionsService({
    repo,
    reports,
    parse,
    config: { maxTranscriptChars: 100 },
  });
  return { repo, reports, parse, service };
};

describe('sessions service — create', () => {
  it('deve criar a sessão com a transcrição colada', async () => {
    const { service, repo } = setup();

    await service.create(user, 'r1', {
      kind: 'text',
      heldOn: '2026-10-01',
      transcript: '  Marina: Oi!  ',
    });

    expect(repo.create).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1', {
      heldOn: '2026-10-01',
      transcript: 'Marina: Oi!',
    });
  });

  it('deve extrair a transcrição do arquivo enviado', async () => {
    const { service, repo, parse } = setup();
    const buffer = Buffer.from('x');

    await service.create(user, 'r1', {
      kind: 'file',
      heldOn: '2026-10-01',
      fileName: 'a.vtt',
      buffer,
    });

    expect(parse).toHaveBeenCalledWith(buffer, 'a.vtt');
    expect(repo.create).toHaveBeenCalledWith(FIXED_LEADER_ID, 'r1', {
      heldOn: '2026-10-01',
      transcript: 'Texto do arquivo',
    });
  });

  it('deve recusar transcrição vazia', async () => {
    const { service, repo } = setup();

    await expect(
      service.create(user, 'r1', { kind: 'text', heldOn: '2026-10-01', transcript: '   ' }),
    ).rejects.toMatchObject({ code: 'EMPTY_TRANSCRIPT', statusCode: 422 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve recusar transcrição acima do limite', async () => {
    const { service } = setup();

    await expect(
      service.create(user, 'r1', {
        kind: 'text',
        heldOn: '2026-10-01',
        transcript: 'a'.repeat(101),
      }),
    ).rejects.toMatchObject({ code: 'TRANSCRIPT_TOO_LONG', statusCode: 422 });
  });

  it('deve lançar NotFoundError quando o liderado não existe ou foi excluído', async () => {
    const { service, repo } = setup(false);

    await expect(
      service.create(user, 'r1', { kind: 'text', heldOn: '2026-10-01', transcript: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe('sessions service — leitura e edição', () => {
  it('deve devolver a transcrição só no detalhe, não na listagem', async () => {
    const { service, repo } = setup();
    vi.mocked(repo.listByReport).mockResolvedValue([record()]);

    const detail = await service.getById(user, 's1');
    const list = await service.listByReport(user, 'r1');

    expect(detail.transcript).toBe('Marina: Oi!');
    expect(detail.heldOn).toBe('2026-10-01');
    expect(list[0]).not.toHaveProperty('transcript');
  });

  it('deve lançar NotFoundError ao editar sessão inexistente', async () => {
    const { service, repo } = setup();
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(service.update(user, 'x', { heldOn: '2026-10-02' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('deve validar a transcrição editada', async () => {
    const { service } = setup();

    await expect(service.update(user, 's1', { transcript: '  ' })).rejects.toMatchObject({
      code: 'EMPTY_TRANSCRIPT',
    });
  });
});

describe('sessions service — remove', () => {
  it('deve apagar o encontro do líder', async () => {
    const { service, repo } = setup();

    await service.remove(user, 's1');

    expect(repo.remove).toHaveBeenCalledWith(FIXED_LEADER_ID, 's1');
  });

  it('deve dar 404 e não apagar quando o encontro não é visível', async () => {
    const { service, repo } = setup();
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(service.remove(user, 's1')).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
