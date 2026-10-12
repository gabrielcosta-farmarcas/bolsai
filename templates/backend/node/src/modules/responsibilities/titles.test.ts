import { describe, expect, it, vi } from 'vitest';
import { makeFakeAiClient } from '../../shared/ai/fake-ai-client.js';
import { AiNotConfiguredError } from '../../shared/ai/ai-client.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import type {
  ResponsibilitiesRepository,
  ResponsibilityRecord,
} from './responsibilities.service.js';
import { buildTitlesInput, makeTitleSuggester, readTitles } from './titles.js';

const item = (
  id: string,
  position: number,
  overrides: Partial<ResponsibilityRecord> = {},
): ResponsibilityRecord => ({
  id,
  leaderId: FIXED_LEADER_ID,
  directReportId: 'r1',
  position,
  title: `Provisório ${position}`,
  titleSource: 'fallback',
  text: `Texto completo da responsabilidade ${position}.`,
  retired: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const setup = (records: ResponsibilityRecord[]) => {
  const repo: ResponsibilitiesRepository = {
    listByReport: vi.fn().mockResolvedValue(records),
    findById: vi.fn(),
    listAll: vi.fn(),
    updateTitle: vi.fn(),
    setAiTitles: vi.fn(),
  };
  return repo;
};

describe('readTitles', () => {
  it('deve ler os títulos válidos por posição e limpar espaços e ponto final', () => {
    const result = readTitles(
      JSON.stringify({
        titles: [
          { ref: 'R1', title: ' Atendimento ao cliente. ' },
          { ref: 'R3', title: 'CRM' },
        ],
      }),
      3,
    );

    expect(result.get(0)).toBe('Atendimento ao cliente');
    expect(result.get(2)).toBe('CRM');
    expect(result.has(1)).toBe(false);
  });

  it('deve ignorar referência inexistente, título vazio ou longo demais e lixo', () => {
    expect(
      readTitles(
        JSON.stringify({
          titles: [
            { ref: 'R9', title: 'Não existe' },
            { ref: 'R1', title: '   ' },
            { ref: 'R2', title: 'x'.repeat(61) },
            { ref: 'qualquer', title: 'Ruim' },
          ],
        }),
        2,
      ).size,
    ).toBe(0);
    expect(readTitles('não é json', 2).size).toBe(0);
  });
});

describe('buildTitlesInput', () => {
  it('deve numerar as responsabilidades dentro da tag', () => {
    expect(buildTitlesInput(['Atender', 'Registrar'])).toBe(
      '<responsabilidades>\nR1: Atender\nR2: Registrar\n</responsabilidades>',
    );
  });
});

describe('makeTitleSuggester', () => {
  it('deve gravar títulos da IA só para os de reserva e nunca para os que a líder escreveu', async () => {
    const repo = setup([
      item('q1', 1),
      item('q2', 2, { titleSource: 'leader', title: 'Da líder' }),
      item('q3', 3),
    ]);
    const fake = makeFakeAiClient([
      {
        titles: [
          { ref: 'R1', title: 'Pontos de atrito' },
          { ref: 'R2', title: 'Registro no CRM' },
        ],
      },
    ]);
    const suggester = makeTitleSuggester({
      repo,
      getAiClient: () => fake.client,
      schedule: (job) => void job(),
    });

    suggester.suggestForReport(FIXED_LEADER_ID, 'r1');
    await vi.waitFor(() => expect(repo.setAiTitles).toHaveBeenCalled());

    // Só q1 e q3 foram enviados (q2 é da líder): R1 → q1, R2 → q3.
    expect(fake.calls[0]?.user).toContain('R1: Texto completo da responsabilidade 1.');
    expect(fake.calls[0]?.user).toContain('R2: Texto completo da responsabilidade 3.');
    expect(fake.calls[0]?.user).not.toContain('responsabilidade 2.');
    expect(repo.setAiTitles).toHaveBeenCalledWith(FIXED_LEADER_ID, [
      { id: 'q1', title: 'Pontos de atrito' },
      { id: 'q3', title: 'Registro no CRM' },
    ]);
  });

  it('não deve chamar a IA quando não há título de reserva', async () => {
    const repo = setup([item('q1', 1, { titleSource: 'ai' })]);
    const fake = makeFakeAiClient([]);
    const suggester = makeTitleSuggester({
      repo,
      getAiClient: () => fake.client,
      schedule: (job) => void job(),
    });

    suggester.suggestForReport(FIXED_LEADER_ID, 'r1');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(fake.calls).toHaveLength(0);
    expect(repo.setAiTitles).not.toHaveBeenCalled();
  });

  it('não deve falhar nem alterar nada quando a IA não está configurada', async () => {
    const repo = setup([item('q1', 1)]);
    const suggester = makeTitleSuggester({
      repo,
      getAiClient: () => {
        throw new AiNotConfiguredError();
      },
      schedule: (job) => void job(),
    });

    expect(() => suggester.suggestForReport(FIXED_LEADER_ID, 'r1')).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(repo.setAiTitles).not.toHaveBeenCalled();
  });

  it('não deve alterar nada quando a IA falha ou devolve lixo', async () => {
    const repo = setup([item('q1', 1)]);
    const failing = makeFakeAiClient([new Error('rede caiu')]);
    const garbage = makeFakeAiClient(['isto não é json']);

    makeTitleSuggester({
      repo,
      getAiClient: () => failing.client,
      schedule: (job) => void job(),
    }).suggestForReport(FIXED_LEADER_ID, 'r1');
    makeTitleSuggester({
      repo,
      getAiClient: () => garbage.client,
      schedule: (job) => void job(),
    }).suggestForReport(FIXED_LEADER_ID, 'r1');
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(repo.setAiTitles).not.toHaveBeenCalledWith(
      FIXED_LEADER_ID,
      expect.arrayContaining([expect.anything()]),
    );
  });
});
