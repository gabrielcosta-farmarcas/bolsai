import { describe, expect, it } from 'vitest';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import {
  analysisOutputSchema,
  reviewedAnalysisSchema,
  storedAnalysisSchema,
} from './analysis.schema.js';

const valid = {
  summary: 'Conversa sobre o projeto novo e a rotina de estudos.',
  themes: [{ title: 'Projeto novo', detail: 'Marina quer participar do desenho.' }],
  agreements: [
    {
      description: 'Enviar a proposta de escopo',
      owner: 'report',
      due_date: '2026-10-20',
      evidence_excerpt: 'Eu te mando a proposta até o dia 20.',
    },
  ],
  previous_agreements: [{ id: 'abc', suggested_status: 'done', evidence: 'Já finalizei.' }],
  development_signals: [
    { responsibility_ref: 'R1', observation: 'Expôs ideias com clareza.', kind: 'growth' },
  ],
  attention_points: ['Carga de trabalho alta'],
  next_questions: ['O que te motivaria nos próximos meses?'],
  private_leader_notes: 'Acompanhar o ritmo.',
  leader_feedback: sampleLeaderFeedback,
};

// Formato guardado/revisado: observações apontam para o id da responsabilidade (ou nulo).
const validStored = {
  ...valid,
  development_signals: [
    { responsibility_id: null, observation: 'Expôs ideias com clareza.', kind: 'growth' },
  ],
};

describe('analysisOutputSchema', () => {
  it('deve aceitar uma análise completa', () => {
    expect(analysisOutputSchema.safeParse(valid).success).toBe(true);
  });

  it('deve aceitar prazo nulo quando não foi dito', () => {
    const result = analysisOutputSchema.safeParse({
      ...valid,
      agreements: [{ ...valid.agreements[0], due_date: null }],
    });

    expect(result.success).toBe(true);
  });

  it('deve recusar responsável fora de leader/report', () => {
    const result = analysisOutputSchema.safeParse({
      ...valid,
      agreements: [{ ...valid.agreements[0], owner: 'chefe' }],
    });

    expect(result.success).toBe(false);
  });

  it('deve recusar prazo fora do formato AAAA-MM-DD', () => {
    const result = analysisOutputSchema.safeParse({
      ...valid,
      agreements: [{ ...valid.agreements[0], due_date: '20/10/2026' }],
    });

    expect(result.success).toBe(false);
  });

  it('deve recusar combinado sem trecho de evidência', () => {
    const result = analysisOutputSchema.safeParse({
      ...valid,
      agreements: [{ ...valid.agreements[0], evidence_excerpt: '' }],
    });

    expect(result.success).toBe(false);
  });
});

describe('leader_feedback', () => {
  it('deve ser obrigatório na saída da IA e aceitar só as avaliações previstas', () => {
    const { leader_feedback: _omit, ...withoutFeedback } = valid;

    expect(analysisOutputSchema.safeParse(withoutFeedback).success).toBe(false);
    expect(
      analysisOutputSchema.safeParse({
        ...valid,
        leader_feedback: { ...sampleLeaderFeedback, overall: 'ótimo' },
      }).success,
    ).toBe(false);
  });

  it('deve exigir sugestão concreta em cada oportunidade', () => {
    const result = analysisOutputSchema.safeParse({
      ...valid,
      leader_feedback: {
        ...sampleLeaderFeedback,
        opportunities: [{ point: 'Pouca escuta', suggestion: '', evidence: '' }],
      },
    });

    expect(result.success).toBe(false);
  });

  it('deve ser opcional na revisão, para análises antigas', () => {
    const { leader_feedback: _omit, ...legacy } = validStored;

    expect(reviewedAnalysisSchema.safeParse(legacy).success).toBe(true);
  });
});

describe('reviewedAnalysisSchema', () => {
  it('deve aceitar id opcional (uuid) nos combinados', () => {
    const withId = {
      ...validStored,
      agreements: [{ ...valid.agreements[0], id: '018f0000-0000-7000-8000-0000000000c1' }],
    };

    expect(reviewedAnalysisSchema.safeParse(withId).success).toBe(true);
    expect(reviewedAnalysisSchema.safeParse(validStored).success).toBe(true);
    expect(
      reviewedAnalysisSchema.safeParse({
        ...validStored,
        agreements: [{ ...valid.agreements[0], id: 'não-é-uuid' }],
      }).success,
    ).toBe(false);
  });
});

describe('storedAnalysisSchema', () => {
  const stored = {
    ...valid,
    development_signals: [
      {
        responsibility_id: '018f0000-0000-7000-8000-0000000000c1',
        observation: 'Expôs ideias com clareza.',
        kind: 'growth',
      },
      { responsibility_id: null, observation: 'Assunto de carreira.', kind: 'neutral' },
    ],
  };

  it('deve guardar a observação com o id da responsabilidade ou nulo (fora)', () => {
    expect(storedAnalysisSchema.safeParse(stored).success).toBe(true);
    expect(reviewedAnalysisSchema.safeParse(stored).success).toBe(true);
  });

  it('não deve aceitar nome livre nem referência R1 no formato guardado', () => {
    const free = {
      ...stored,
      development_signals: [{ responsibility: 'Comunicação', observation: 'x', kind: 'growth' }],
    };
    const ref = {
      ...stored,
      development_signals: [{ responsibility_id: 'R1', observation: 'x', kind: 'growth' }],
    };

    expect(storedAnalysisSchema.safeParse(free).success).toBe(false);
    expect(storedAnalysisSchema.safeParse(ref).success).toBe(false);
  });

  it('deve exigir a referência (R1… ou FORA) na saída da IA', () => {
    const noRef = { ...valid, development_signals: [{ observation: 'x', kind: 'growth' }] };

    expect(analysisOutputSchema.safeParse(noRef).success).toBe(false);
    expect(
      analysisOutputSchema.safeParse({
        ...valid,
        development_signals: [{ responsibility_ref: 'FORA', observation: 'x', kind: 'neutral' }],
      }).success,
    ).toBe(true);
  });
});
