import { describe, expect, it, vi } from 'vitest';
import { AiNotConfiguredError } from '../../shared/ai/ai-client.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import type { AgreementRecord } from '../agreements/agreements.service.js';
import type { ResponsibilityRecord } from '../responsibilities/responsibilities.service.js';
import {
  makePreparationsService,
  type PreparationRecord,
  type PreparationsRepository,
} from './preparations.service.js';

const user = { leaderId: FIXED_LEADER_ID };
const REPORT = '018f0000-0000-7000-8000-0000000000a1';
const ID = {
  q1: '018f0000-0000-7000-8000-000000000001',
  q2: '018f0000-0000-7000-8000-000000000002',
  q3: '018f0000-0000-7000-8000-000000000003',
  q9: '018f0000-0000-7000-8000-000000000009',
  g1: '018f0000-0000-7000-8000-0000000000c1',
  g2: '018f0000-0000-7000-8000-0000000000c2',
};

const responsibility = (
  id: string,
  position: number,
  title: string,
  retired = false,
): ResponsibilityRecord => ({
  id,
  leaderId: FIXED_LEADER_ID,
  directReportId: REPORT,
  position,
  title,
  titleSource: 'fallback',
  text: `Texto de ${title}`,
  retired,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

const RESPONSIBILITIES = [
  responsibility(ID.q3, 3, 'Processos'),
  responsibility(ID.q1, 1, 'Atendimento'),
  responsibility(ID.q2, 2, 'Relatórios'),
  responsibility(ID.q9, 4, 'Antiga', true),
];

const agreement = (overrides: Partial<AgreementRecord>): AgreementRecord => ({
  id: ID.g1,
  leaderId: FIXED_LEADER_ID,
  directReportId: REPORT,
  directReportName: 'Marina',
  originSessionId: null,
  analysisId: null,
  description: 'Enviar a proposta',
  owner: 'report',
  dueDate: new Date('2026-10-15T00:00:00.000Z'),
  status: 'open',
  evidenceExcerpt: null,
  origin: 'leader',
  confirmedAt: null,
  closedAt: null,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  ...overrides,
});

const reviewed = (heldOn: string, signalIds: string[]) => ({
  heldOn: new Date(`${heldOn}T00:00:00.000Z`),
  reviewedJson: {
    summary: `Resumo de ${heldOn}.`,
    themes: [{ title: 'Projeto novo', detail: 'Escopo.' }],
    agreements: [],
    previous_agreements: [],
    development_signals: signalIds.map((id) => ({
      responsibility_id: id,
      observation: 'Atendeu bem.',
      kind: 'neutral',
    })),
    attention_points: ['Pessoa: proposta parada.'],
    next_questions: [],
    private_leader_notes: 'Perguntar da proposta.',
    leader_feedback: sampleLeaderFeedback,
  },
});

const validOutput = {
  themes: [{ title: 'Proposta parada', detail: 'Voltou em dois encontros.' }],
  questions: ['O que te motiva hoje?', 'Onde posso apoiar?', 'Como vê sua carreira?'],
};

const setup = (
  outputs: unknown[],
  options: {
    history?: ReturnType<typeof reviewed>[];
    agreements?: AgreementRecord[];
    responsibilities?: ResponsibilityRecord[];
    hasMap?: boolean;
    reportExists?: boolean;
  } = {},
) => {
  const fake = makeFakeAiClient(outputs);
  const jobs: Array<() => Promise<void>> = [];
  const stored: { content?: unknown; failed?: string } = {};
  const record: PreparationRecord = {
    id: 'p1',
    leaderId: FIXED_LEADER_ID,
    directReportId: REPORT,
    model: null,
    status: 'processing',
    errorMessage: null,
    mapVersionUsed: 3,
    content: null,
    createdAt: new Date('2026-10-24T12:00:00.000Z'),
  };
  const repo: PreparationsRepository = {
    create: vi.fn().mockResolvedValue(record),
    markCompleted: vi.fn(async (_id, data) => {
      stored.content = data.content;
    }),
    markFailed: vi.fn(async (_id, message) => {
      stored.failed = message;
    }),
    findLatest: vi.fn().mockResolvedValue(null),
    reviewedHistory: vi.fn().mockResolvedValue(options.history ?? []),
    failStuck: vi.fn().mockResolvedValue(0),
  };
  const service = makePreparationsService({
    repo,
    reports: {
      findById: vi
        .fn()
        .mockResolvedValue(
          options.reportExists === false ? null : { id: REPORT, leaderId: FIXED_LEADER_ID },
        ),
    },
    maps: {
      findCurrent: vi
        .fn()
        .mockResolvedValue(
          options.hasMap === false
            ? null
            : { version: 3, text: 'x', mission: 'Cuidar do cliente.', behaviors: 'Dá feedback.' },
        ),
    },
    responsibilities: {
      listAll: vi.fn().mockResolvedValue(options.responsibilities ?? RESPONSIBILITIES),
    },
    agreements: { listByReport: vi.fn().mockResolvedValue(options.agreements ?? []) },
    getAiClient: () => fake.client,
    prompts: { load: async () => 'PROMPT' },
    schedule: (job) => {
      jobs.push(job);
    },
    now: () => new Date('2026-10-24T15:00:00.000Z'),
  });
  const runJobs = async () => {
    for (const job of jobs.splice(0)) await job();
  };
  return { service, fake, repo, stored, runJobs };
};

describe('preparations service', () => {
  it('deve gerar o roteiro com combinados em aberto, lacunas e temas dos encontros', async () => {
    const { service, fake, stored, runJobs } = setup([validOutput], {
      history: [reviewed('2026-10-10', [ID.q1]), reviewed('2026-10-01', [ID.q1])],
      agreements: [
        agreement({ id: ID.g1 }),
        agreement({ id: ID.g2, status: 'done', description: 'Já feito' }),
      ],
    });

    const dto = await service.start(user, REPORT);
    await runJobs();

    expect(dto.status).toBe('processing');
    const content = stored.content as {
      open_agreements: Array<{ id: string; is_overdue: boolean }>;
      map_gaps: Array<{ responsibility_id: string }>;
      has_history: boolean;
      questions: string[];
    };
    expect(content.has_history).toBe(true);
    expect(content.questions).toHaveLength(3);
    expect(content.open_agreements).toEqual([
      expect.objectContaining({ id: ID.g1, is_overdue: true, due_date: '2026-10-15' }),
    ]);
    expect(content.map_gaps.map((item) => item.responsibility_id)).toEqual([ID.q2, ID.q3]);
    const sent = fake.calls[0]?.user ?? '';
    expect(sent).toContain('Resumo de 2026-10-10.');
    expect(sent).toContain('Resumo de 2026-10-01.');
    expect(sent).toContain('Enviar a proposta');
    expect(sent).not.toContain('Já feito');
    expect(sent).not.toContain('Texto de Antiga');
    expect(sent).toContain('Dá feedback.');
    expect(fake.calls[0]?.system).toBe('PROMPT');
  });

  it('deve se basear só no responsograma e avisar que não há histórico', async () => {
    const { service, fake, stored, runJobs } = setup([validOutput]);

    await service.start(user, REPORT);
    await runJobs();

    const content = stored.content as { has_history: boolean; map_gaps: unknown[] };
    expect(content.has_history).toBe(false);
    expect(content.map_gaps).toEqual([]);
    expect(fake.calls[0]?.user).toContain('Nenhum encontro anterior revisado.');
    expect(fake.calls[0]?.user).toContain('R1: Texto de Atendimento');
  });

  it('deve tentar de novo quando a IA devolve fora de 3 a 5 perguntas', async () => {
    const { service, fake, stored, runJobs } = setup([
      { ...validOutput, questions: ['Só uma?'] },
      validOutput,
    ]);

    await service.start(user, REPORT);
    await runJobs();

    expect(fake.calls).toHaveLength(2);
    expect(fake.calls[1]?.user).toContain('A resposta anterior foi inválida');
    expect((stored.content as { questions: string[] }).questions).toHaveLength(3);
  });

  it('deve marcar falha quando a IA erra duas vezes o formato', async () => {
    const { service, stored, runJobs } = setup(['não é json', '{"themes": []}']);

    await service.start(user, REPORT);
    await runJobs();

    expect(stored.content).toBeUndefined();
    expect(stored.failed).toContain('formato esperado');
  });

  it('deve marcar falha, sem vazar detalhe, quando a IA cai', async () => {
    const { service, stored, runJobs } = setup([new Error('segredo da rede')]);

    await service.start(user, REPORT);
    await runJobs();

    expect(stored.failed).toBe(
      'Não foi possível obter a resposta da IA. Tente de novo em instantes.',
    );
  });

  it('deve limitar os temas a 4', async () => {
    const themes = Array.from({ length: 6 }, (_, index) => ({ title: `T${index}`, detail: '' }));
    const { service, stored, runJobs } = setup([{ ...validOutput, themes }]);

    await service.start(user, REPORT);
    await runJobs();

    expect((stored.content as { themes: unknown[] }).themes).toHaveLength(4);
  });

  it('deve recusar quando o responsograma não tem de 3 a 10 responsabilidades', async () => {
    const { service, repo } = setup([validOutput], {
      responsibilities: [responsibility(ID.q1, 1, 'Atendimento')],
    });

    await expect(service.start(user, REPORT)).rejects.toMatchObject({
      code: 'RESPONSIBILITIES_REQUIRED',
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve dar 404 para pessoa que não é da líder ou foi excluída', async () => {
    const { service } = setup([validOutput], { reportExists: false });

    await expect(service.start(user, REPORT)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getLatest(user, REPORT)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deve recusar quando a IA não está configurada, sem criar registro', async () => {
    const { repo } = setup([validOutput]);
    const service = makePreparationsService({
      repo,
      reports: { findById: async () => ({ id: REPORT, leaderId: FIXED_LEADER_ID }) },
      maps: { findCurrent: async () => null },
      responsibilities: { listAll: async () => [] },
      agreements: { listByReport: async () => [] },
      getAiClient: () => {
        throw new AiNotConfiguredError();
      },
      prompts: { load: async () => 'PROMPT' },
    });

    await expect(service.start(user, REPORT)).rejects.toBeInstanceOf(AiNotConfiguredError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve devolver o último roteiro, ou nulo quando nunca houve', async () => {
    const { service, repo } = setup([]);
    await expect(service.getLatest(user, REPORT)).resolves.toBeNull();

    vi.mocked(repo.findLatest).mockResolvedValue({
      id: 'p1',
      leaderId: FIXED_LEADER_ID,
      directReportId: REPORT,
      model: 'm',
      status: 'failed',
      errorMessage: 'falhou',
      mapVersionUsed: 1,
      content: null,
      createdAt: new Date('2026-10-24T12:00:00.000Z'),
    });
    await expect(service.getLatest(user, REPORT)).resolves.toMatchObject({
      status: 'failed',
      errorMessage: 'falhou',
      content: null,
    });
  });
});
