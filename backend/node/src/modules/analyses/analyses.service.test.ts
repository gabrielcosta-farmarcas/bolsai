import { describe, expect, it, vi } from 'vitest';
import { AiNotConfiguredError } from '../../shared/ai/ai-client.js';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import type { AnalysisOutput } from './analysis.schema.js';
import {
  makeAnalysesService,
  type AnalysesRepository,
  type AnalysisRecord,
} from './analyses.service.js';

const user = { leaderId: FIXED_LEADER_ID };

const validOutput: AnalysisOutput = {
  summary: 'Conversa sobre o projeto novo.',
  themes: [{ title: 'Projeto novo', detail: 'Quer participar do desenho.' }],
  agreements: [
    {
      description: 'Enviar a proposta de escopo',
      owner: 'report',
      due_date: null,
      evidence_excerpt: 'Eu te mando a proposta.',
    },
  ],
  previous_agreements: [],
  development_signals: [
    { responsibility_ref: 'R2', observation: 'Quer participar do desenho.', kind: 'growth' },
    { responsibility_ref: 'FORA', observation: 'Comentou a carga de trabalho.', kind: 'neutral' },
  ],
  attention_points: [],
  next_questions: ['O que te motiva hoje?'],
  private_leader_notes: '',
  leader_feedback: sampleLeaderFeedback,
};

// Responsabilidades da pessoa: 4 ativas (fora de ordem no banco, para provar que a ordem é a do responsograma)
// e 1 aposentada, que NUNCA deve ir para a IA.
const ID = {
  q1: '018f0000-0000-7000-8000-000000000001',
  q2: '018f0000-0000-7000-8000-000000000002',
  q3: '018f0000-0000-7000-8000-000000000003',
  q4: '018f0000-0000-7000-8000-000000000004',
  q9: '018f0000-0000-7000-8000-000000000009',
};

const RESPONSIBILITIES = [
  {
    id: ID.q3,
    position: 3,
    text: 'Acompanhar a implementação de soluções e ajustes.',
    retired: false,
  },
  {
    id: ID.q1,
    position: 1,
    text: 'Mapear pontos de atrito na jornada do cliente.',
    retired: false,
  },
  {
    id: ID.q4,
    position: 4,
    text: 'Registrar e controlar o fluxo de demandas via CRM.',
    retired: false,
  },
  {
    id: ID.q2,
    position: 2,
    text: 'Prestar atendimento e suporte técnico aos clientes.',
    retired: false,
  },
  { id: ID.q9, position: 5, text: 'Responsabilidade antiga que saiu do cargo.', retired: true },
];

// O que é guardado: cada observação aponta para o id da responsabilidade (FORA vira nulo).
const storedOutput = {
  ...validOutput,
  development_signals: [
    { responsibility_id: ID.q2, observation: 'Quer participar do desenho.', kind: 'growth' },
    { responsibility_id: null, observation: 'Comentou a carga de trabalho.', kind: 'neutral' },
  ],
};

const record = (overrides: Partial<AnalysisRecord> = {}): AnalysisRecord => ({
  id: 'a1',
  leaderId: FIXED_LEADER_ID,
  sessionId: 's1',
  model: null,
  status: 'processing',
  errorMessage: null,
  mapVersionUsed: 2,
  rawJson: null,
  reviewedJson: null,
  reviewedAt: null,
  createdAt: new Date('2026-10-01T12:00:00.000Z'),
  ...overrides,
});

const session = {
  id: 's1',
  leaderId: FIXED_LEADER_ID,
  directReportId: 'r1',
  heldOn: new Date('2026-10-01T00:00:00.000Z'),
  transcript: 'Marina: Eu te mando a proposta.',
  status: 'draft' as const,
};

type SetupOptions = {
  outputs?: unknown[];
  aiConfigured?: boolean;
  sessionFound?: boolean;
  maxTranscriptChars?: number;
  repo?: Partial<AnalysesRepository>;
  responsibilities?: typeof RESPONSIBILITIES;
};

const setup = ({
  outputs = [validOutput],
  aiConfigured = true,
  sessionFound = true,
  maxTranscriptChars = 10_000,
  repo: repoOverrides = {},
  responsibilities = RESPONSIBILITIES,
}: SetupOptions = {}) => {
  const fake = makeFakeAiClient(outputs);
  const repo: AnalysesRepository = {
    create: vi.fn().mockResolvedValue(record()),
    markCompleted: vi.fn(),
    markFailed: vi.fn(),
    findById: vi.fn(),
    listBySession: vi.fn().mockResolvedValue([]),
    saveFinal: vi.fn(),
    failStuck: vi.fn().mockResolvedValue(0),
    lastReviewedSummaries: vi
      .fn()
      .mockResolvedValue([
        { heldOn: new Date('2026-09-10T00:00:00.000Z'), summary: 'Resumo do mês passado.' },
      ]),
    ...repoOverrides,
  };
  const jobs: Array<() => Promise<void>> = [];
  const service = makeAnalysesService({
    repo,
    sessions: { findById: vi.fn().mockResolvedValue(sessionFound ? session : null) },
    maps: {
      findCurrent: vi.fn().mockResolvedValue({
        version: 2,
        text: 'Texto composto do responsograma.',
        mission: 'Garantir uma ótima experiência do cliente.',
      }),
    },
    responsibilities: { listAll: vi.fn().mockResolvedValue(responsibilities) },
    agreements: {
      listOpen: vi
        .fn()
        .mockResolvedValue([
          { id: 'open-1', description: 'Revisar o painel', owner: 'leader', dueDate: '2026-09-30' },
        ]),
    },
    getAiClient: () => {
      if (!aiConfigured) throw new AiNotConfiguredError();
      return fake.client;
    },
    prompts: { load: vi.fn().mockResolvedValue('PROMPT-DO-SISTEMA') },
    config: { maxTranscriptChars },
    schedule: (job) => {
      jobs.push(job);
    },
  });
  const runJobs = async () => {
    for (const job of jobs.splice(0)) await job();
  };
  return { service, repo, fake, runJobs };
};

describe('analyses service — start', () => {
  it('deve criar a análise em processamento e concluir em segundo plano com o contexto completo', async () => {
    const { service, repo, fake, runJobs } = setup();

    const started = await service.start(user, 's1');
    expect(started.status).toBe('processing');
    expect(fake.calls).toHaveLength(0);

    await runJobs();

    expect(repo.create).toHaveBeenCalledWith(FIXED_LEADER_ID, 's1', { mapVersionUsed: 2 });
    expect(repo.markCompleted).toHaveBeenCalledWith('a1', {
      rawJson: storedOutput,
      model: 'fake-model',
      inputTokens: 10,
      outputTokens: 20,
    });
    const call = fake.calls[0];
    expect(call?.system).toContain('PROMPT-DO-SISTEMA');
    expect(call?.user).toContain('Eu te mando a proposta.');
    expect(call?.user).toContain('Garantir uma ótima experiência do cliente.');
    expect(call?.user).toContain('Resumo do mês passado.');
    expect(call?.user).toContain('open-1');
  });

  it('deve enviar à IA TODAS as responsabilidades ativas, numeradas na ordem do responsograma, e nenhuma aposentada', async () => {
    const { service, fake, runJobs } = setup();

    await service.start(user, 's1');
    await runJobs();

    const sent = fake.calls[0]?.user ?? '';
    const ordered = [
      'R1: Mapear pontos de atrito na jornada do cliente.',
      'R2: Prestar atendimento e suporte técnico aos clientes.',
      'R3: Acompanhar a implementação de soluções e ajustes.',
      'R4: Registrar e controlar o fluxo de demandas via CRM.',
    ];
    for (const line of ordered) expect(sent).toContain(line);
    expect(ordered.map((line) => sent.indexOf(line))).toEqual(
      [...ordered.map((line) => sent.indexOf(line))].sort((a, b) => a - b),
    );
    expect(sent).not.toContain('R5:');
    expect(sent).not.toContain('Responsabilidade antiga');
  });

  it('deve trocar as referências pelos ids e guardar FORA como nulo', async () => {
    const { service, repo, runJobs } = setup({
      outputs: [
        {
          ...validOutput,
          development_signals: [
            { responsibility_ref: 'r4', observation: 'Registrou tudo no CRM.', kind: 'growth' },
            { responsibility_ref: 'R1', observation: 'Mapeou um atrito.', kind: 'attention' },
            { responsibility_ref: 'FORA', observation: 'Assunto de carreira.', kind: 'neutral' },
          ],
        },
      ],
    });

    await service.start(user, 's1');
    await runJobs();

    const stored = vi.mocked(repo.markCompleted).mock.calls[0]?.[1].rawJson.development_signals;
    expect(stored?.map((item) => item.responsibility_id)).toEqual([ID.q4, ID.q1, null]);
    expect(JSON.stringify(stored)).not.toContain('R4');
  });

  it('deve recusar referência que não existe na lista (a IA tenta de novo e a mensagem diz as válidas)', async () => {
    const invented = {
      ...validOutput,
      development_signals: [
        { responsibility_ref: 'R9', observation: 'Algo.', kind: 'neutral' },
        { responsibility_ref: 'Comunicação', observation: 'Outro.', kind: 'neutral' },
      ],
    };
    const { service, fake, repo, runJobs } = setup({ outputs: [invented, validOutput] });

    await service.start(user, 's1');
    await runJobs();

    expect(fake.calls).toHaveLength(2);
    expect(fake.calls[1]?.user).toContain('R9');
    expect(fake.calls[1]?.user).toContain('R1, R2, R3, R4');
    expect(repo.markCompleted).toHaveBeenCalledTimes(1);
  });

  it('deve marcar como falha se a IA insistir em referência inexistente', async () => {
    const invented = {
      ...validOutput,
      development_signals: [{ responsibility_ref: 'R7', observation: 'x', kind: 'neutral' }],
    };
    const { service, repo, runJobs } = setup({ outputs: [invented, invented] });

    await service.start(user, 's1');
    await runJobs();

    expect(repo.markCompleted).not.toHaveBeenCalled();
    expect(repo.markFailed).toHaveBeenCalledTimes(1);
  });

  it('deve tratar mais de 5 observações como saída inválida', async () => {
    const many = {
      ...validOutput,
      development_signals: Array.from({ length: 6 }, () => ({
        responsibility_ref: 'R1',
        observation: 'Fato.',
        kind: 'neutral',
      })),
    };
    const { service, fake, repo, runJobs } = setup({ outputs: [many, validOutput] });

    await service.start(user, 's1');
    await runJobs();

    expect(fake.calls).toHaveLength(2);
    expect(repo.markCompleted).toHaveBeenCalledTimes(1);
  });

  it('deve aceitar análise sem nenhuma observação (responsabilidades não tratadas ficam sem sinal)', async () => {
    const { service, repo, runJobs } = setup({
      outputs: [{ ...validOutput, development_signals: [] }],
    });

    await service.start(user, 's1');
    await runJobs();

    expect(vi.mocked(repo.markCompleted).mock.calls[0]?.[1].rawJson.development_signals).toEqual(
      [],
    );
  });

  it.each([
    ['menos de 3 responsabilidades', RESPONSIBILITIES.slice(0, 2)],
    ['nenhuma responsabilidade ativa', RESPONSIBILITIES.filter((item) => item.retired)],
    [
      'mais de 10 responsabilidades',
      Array.from({ length: 11 }, (_, index) => ({
        id: `x${index}`,
        position: index + 1,
        text: `Responsabilidade ${index + 1}`,
        retired: false,
      })),
    ],
  ])('deve recusar a análise com %s, sem criar nada nem chamar a IA', async (_name, list) => {
    const { service, repo, fake } = setup({ responsibilities: list });

    await expect(service.start(user, 's1')).rejects.toMatchObject({
      code: 'RESPONSIBILITIES_REQUIRED',
      statusCode: 422,
    });
    expect(repo.create).not.toHaveBeenCalled();
    expect(fake.calls).toHaveLength(0);
  });

  it('deve tentar de novo uma vez quando a saída é inválida e informar o erro à IA', async () => {
    const { service, repo, fake, runJobs } = setup({ outputs: ['isto não é JSON', validOutput] });

    await service.start(user, 's1');
    await runJobs();

    expect(fake.calls).toHaveLength(2);
    expect(fake.calls[1]?.user).toContain('inválida');
    expect(repo.markCompleted).toHaveBeenCalledTimes(1);
    expect(repo.markFailed).not.toHaveBeenCalled();
  });

  it('deve marcar como falha após duas saídas inválidas, sem vazar conteúdo na mensagem', async () => {
    const { service, repo, runJobs } = setup({
      outputs: [{ summary: 'SEGREDO-NA-SAIDA' }, { summary: 'SEGREDO-NA-SAIDA' }],
    });

    await service.start(user, 's1');
    await runJobs();

    expect(repo.markCompleted).not.toHaveBeenCalled();
    const message = vi.mocked(repo.markFailed).mock.calls[0]?.[1] ?? '';
    expect(message).toContain('formato esperado');
    expect(message).not.toContain('SEGREDO');
  });

  it('deve tratar combinado anterior com id desconhecido como saída inválida', async () => {
    const withUnknownId = {
      ...validOutput,
      previous_agreements: [{ id: 'inventado', suggested_status: 'done', evidence: 'x' }],
    };
    const { service, fake, repo, runJobs } = setup({ outputs: [withUnknownId, validOutput] });

    await service.start(user, 's1');
    await runJobs();

    expect(fake.calls).toHaveLength(2);
    expect(repo.markCompleted).toHaveBeenCalledTimes(1);
  });

  it('deve marcar como falha com mensagem amigável quando a chamada à IA quebra', async () => {
    const { service, repo, runJobs } = setup({ outputs: [new Error('connect ECONNRESET')] });

    await service.start(user, 's1');
    await runJobs();

    expect(vi.mocked(repo.markFailed).mock.calls[0]?.[1]).toContain('Não foi possível');
  });

  it('deve recusar quando a IA não está configurada, sem criar análise', async () => {
    const { service, repo } = setup({ aiConfigured: false });

    await expect(service.start(user, 's1')).rejects.toBeInstanceOf(AiNotConfiguredError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve recusar transcrição acima do limite configurado', async () => {
    const { service, repo } = setup({ maxTranscriptChars: 5 });

    await expect(service.start(user, 's1')).rejects.toMatchObject({
      code: 'TRANSCRIPT_TOO_LONG',
      statusCode: 422,
    });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('deve lançar NotFoundError quando a sessão não existe ou o liderado foi excluído', async () => {
    const { service } = setup({ sessionFound: false });

    await expect(service.start(user, 's1')).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('analyses service — saveReview', () => {
  const reviewed = { ...storedOutput, summary: 'Resumo editado pelo líder.' };

  it('deve salvar a revisão como versão final de uma análise concluída da sessão', async () => {
    const saveFinal = vi
      .fn()
      .mockResolvedValue(record({ status: 'completed', reviewedJson: reviewed }));
    const { service } = setup({
      repo: {
        findById: vi.fn().mockResolvedValue(record({ status: 'completed', rawJson: storedOutput })),
        saveFinal,
      },
    });

    await service.saveReview(user, 's1', { analysisId: 'a1', reviewedJson: reviewed });

    expect(saveFinal).toHaveBeenCalledWith(FIXED_LEADER_ID, 's1', 'a1', reviewed, expect.any(Date));
  });

  it('deve recusar observação que aponta para responsabilidade de outra pessoa, sem salvar', async () => {
    const foreign = {
      ...reviewed,
      development_signals: [
        {
          responsibility_id: '018f0000-0000-7000-8000-0000000000aa',
          observation: 'x',
          kind: 'neutral',
        },
      ],
    };
    const { service, repo } = setup({
      repo: { findById: vi.fn().mockResolvedValue(record({ status: 'completed' })) },
    });

    await expect(
      service.saveReview(user, 's1', { analysisId: 'a1', reviewedJson: foreign }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSIBILITY_REFERENCE', statusCode: 422 });
    expect(repo.saveFinal).not.toHaveBeenCalled();
  });

  it('deve aceitar apontar para uma responsabilidade da pessoa, inclusive aposentada, ou para nenhuma', async () => {
    const saveFinal = vi.fn().mockResolvedValue(record({ status: 'completed' }));
    const { service } = setup({
      repo: { findById: vi.fn().mockResolvedValue(record({ status: 'completed' })), saveFinal },
    });
    const review = {
      ...reviewed,
      development_signals: [ID.q1, ID.q9, null].map((id) => ({
        responsibility_id: id,
        observation: 'Fato.',
        kind: 'neutral',
      })),
    };

    await service.saveReview(user, 's1', { analysisId: 'a1', reviewedJson: review });

    expect(saveFinal).toHaveBeenCalledOnce();
  });

  it('deve recusar análise ainda em processamento', async () => {
    const { service, repo } = setup({
      repo: { findById: vi.fn().mockResolvedValue(record({ status: 'processing' })) },
    });

    await expect(
      service.saveReview(user, 's1', { analysisId: 'a1', reviewedJson: reviewed }),
    ).rejects.toMatchObject({ code: 'ANALYSIS_NOT_READY', statusCode: 409 });
    expect(repo.saveFinal).not.toHaveBeenCalled();
  });

  it('deve recusar análise de outra sessão', async () => {
    const { service } = setup({
      repo: {
        findById: vi.fn().mockResolvedValue(record({ status: 'completed', sessionId: 'outra' })),
      },
    });

    await expect(
      service.saveReview(user, 's1', { analysisId: 'a1', reviewedJson: reviewed }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deve recusar revisão fora do formato', async () => {
    const { service, repo } = setup({
      repo: { findById: vi.fn().mockResolvedValue(record({ status: 'completed' })) },
    });

    await expect(
      service.saveReview(user, 's1', { analysisId: 'a1', reviewedJson: { summary: 'só isso' } }),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.saveFinal).not.toHaveBeenCalled();
  });
});

describe('analyses service — recuperação ao iniciar', () => {
  it('deve marcar como falha as análises que ficaram em processamento', async () => {
    const { service, repo } = setup({ repo: { failStuck: vi.fn().mockResolvedValue(2) } });

    expect(await service.failStuckAnalyses()).toBe(2);
    expect(repo.failStuck).toHaveBeenCalledWith(expect.stringContaining('reiniciada'));
  });
});
