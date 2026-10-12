import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../shared/errors/not-found-error.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import {
  buildTimeline,
  makeTimelineService,
  type TimelineAgreementData,
  type TimelineSessionData,
} from './timeline.service.js';

// Cada observação aponta para o id da responsabilidade; o título vem da pessoa (ativas e aposentadas).
const COMUNICACAO = '018f0000-0000-7000-8000-0000000000c1';
const DADOS = '018f0000-0000-7000-8000-0000000000c2';
const REMOVIDA = '018f0000-0000-7000-8000-0000000000c3';
const titles = new Map([
  [
    COMUNICACAO,
    { title: 'Comunicação', text: 'Comunicar-se com produto e engenharia, alinhando decisões.' },
  ],
  [
    DADOS,
    { title: 'Qualidade dos dados', text: 'Garantir a qualidade dos dados usados nas análises.' },
  ],
]);

const content = (
  summary: string,
  signals: Array<[string | null, 'growth' | 'attention' | 'neutral']>,
) => ({
  summary,
  themes: [{ title: 'Tema', detail: 'Detalhe' }],
  agreements: [],
  previous_agreements: [],
  development_signals: signals.map(([responsibility_id, kind]) => ({
    responsibility_id,
    observation: `Observação sobre ${responsibility_id ?? 'nada'}`,
    kind,
  })),
  attention_points: [],
  next_questions: [],
  private_leader_notes: 'NOTA-PRIVADA',
});

const sessions: TimelineSessionData[] = [
  {
    id: 's2',
    heldOn: new Date('2026-10-01T00:00:00.000Z'),
    status: 'analysed',
    analysis: {
      rawJson: content('Segundo encontro.', [[COMUNICACAO, 'growth']]),
      reviewedJson: null,
      isFinal: false,
    },
  },
  {
    id: 's1',
    heldOn: new Date('2026-09-10T00:00:00.000Z'),
    status: 'reviewed',
    analysis: {
      rawJson: content('Bruto.', [
        [COMUNICACAO, 'attention'],
        [DADOS, 'neutral'],
      ]),
      reviewedJson: content('Primeiro encontro revisado.', [
        [COMUNICACAO, 'attention'],
        [DADOS, 'neutral'],
      ]),
      isFinal: true,
    },
  },
  { id: 's0', heldOn: new Date('2026-08-01T00:00:00.000Z'), status: 'draft', analysis: null },
];

const agreements: TimelineAgreementData[] = [
  {
    id: 'g1',
    originSessionId: 's1',
    description: 'Revisar o painel',
    owner: 'report',
    dueDate: new Date('2026-09-24T00:00:00.000Z'),
    status: 'done',
  },
  {
    id: 'g2',
    originSessionId: 's2',
    description: 'Escrever a documentação',
    owner: 'report',
    dueDate: new Date('2026-10-02T00:00:00.000Z'),
    status: 'open',
  },
  {
    id: 'g3',
    originSessionId: null,
    description: 'Marcar mentoria',
    owner: 'leader',
    dueDate: null,
    status: 'cancelled',
  },
];

describe('buildTimeline', () => {
  const timeline = buildTimeline(sessions, agreements, '2026-10-05', titles);

  it('deve ordenar os encontros do mais antigo para o mais recente', () => {
    expect(timeline.entries.map((entry) => entry.sessionId)).toEqual(['s0', 's1', 's2']);
  });

  it('deve usar a versão revisada quando existe e a análise bruta quando não', () => {
    expect(timeline.entries[1]).toMatchObject({
      summary: 'Primeiro encontro revisado.',
      isReviewed: true,
    });
    expect(timeline.entries[2]).toMatchObject({ summary: 'Segundo encontro.', isReviewed: false });
    expect(timeline.entries[0]).toMatchObject({ summary: null, signals: [], agreements: [] });
  });

  it('deve ligar cada combinado ao encontro de origem e marcar atrasado', () => {
    expect(timeline.entries[1]?.agreements.map((item) => [item.id, item.status])).toEqual([
      ['g1', 'done'],
    ]);
    expect(timeline.entries[2]?.agreements[0]).toMatchObject({ id: 'g2', isOverdue: true });
  });

  it('deve agrupar os sinais pela responsabilidade (id) e mostrar o título dela', () => {
    const comunicacao = timeline.responsibilities.find(
      (item) => item.responsibility === 'Comunicação',
    );

    expect(comunicacao?.points.map((point) => [point.sessionId, point.kind])).toEqual([
      ['s1', 'attention'],
      ['s2', 'growth'],
    ]);
    expect(timeline.responsibilities).toHaveLength(2);
  });

  it('deve devolver a frase completa de cada responsabilidade para a tela mostrar ao passar o mouse', () => {
    const comunicacao = timeline.responsibilities.find((item) => item.id === COMUNICACAO);

    expect(comunicacao).toMatchObject({
      responsibility: 'Comunicação',
      text: 'Comunicar-se com produto e engenharia, alinhando decisões.',
    });
  });

  it('deve manter separadas duas responsabilidades com o mesmo título', () => {
    const twin = '018f0000-0000-7000-8000-0000000000c9';
    const result = buildTimeline(
      [
        {
          id: 's1',
          heldOn: new Date('2026-10-01T00:00:00.000Z'),
          status: 'reviewed',
          analysis: {
            rawJson: content('x', [
              [COMUNICACAO, 'growth'],
              [twin, 'attention'],
            ]),
            reviewedJson: null,
            isFinal: true,
          },
        },
      ],
      [],
      '2026-10-05',
      new Map([...titles, [twin, { title: 'Comunicação', text: 'Outra frase, mesmo título.' }]]),
    );

    expect(result.responsibilities.map((item) => item.text)).toEqual([
      'Comunicar-se com produto e engenharia, alinhando decisões.',
      'Outra frase, mesmo título.',
    ]);
  });

  it('deve rotular observação fora das responsabilidades e de responsabilidade removida', () => {
    const odd = buildTimeline(
      [
        {
          id: 's9',
          heldOn: new Date('2026-10-01T00:00:00.000Z'),
          status: 'reviewed',
          analysis: {
            rawJson: content('x', [
              [null, 'neutral'],
              [REMOVIDA, 'attention'],
            ]),
            reviewedJson: null,
            isFinal: true,
          },
        },
      ],
      [],
      '2026-10-05',
      titles,
    );

    expect(odd.entries[0]?.signals.map((signal) => signal.responsibility)).toEqual([
      'Fora das responsabilidades',
      'Responsabilidade removida',
    ]);
    expect(odd.responsibilities.map((item) => item.text)).toEqual([null, null]);
  });

  it('deve somar os combinados, inclusive os criados à mão sem encontro', () => {
    expect(timeline.totals).toEqual({ agreements: 3, done: 1, open: 1, cancelled: 1, overdue: 1 });
  });

  it('não deve expor as observações privadas do líder', () => {
    expect(JSON.stringify(timeline)).not.toContain('NOTA-PRIVADA');
  });
});

describe('makeTimelineService', () => {
  it('deve lançar NotFoundError quando a pessoa não existe ou foi excluída', async () => {
    const repo = {
      loadSessions: vi.fn(),
      loadAgreements: vi.fn(),
      loadResponsibilityTitles: vi.fn(),
    };
    const service = makeTimelineService({
      repo,
      reports: { findById: vi.fn().mockResolvedValue(null) },
    });

    await expect(service.get({ leaderId: FIXED_LEADER_ID }, 'r1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repo.loadSessions).not.toHaveBeenCalled();
  });
});
