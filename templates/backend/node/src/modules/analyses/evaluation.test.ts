import { describe, expect, it } from 'vitest';
import { sampleLeaderFeedback } from '../../test/leader-feedback.js';
import type { AnalysisOutput } from './analysis.schema.js';
import { evaluateAnalysis, type Fixture } from './evaluation.js';

const transcript = 'Marina: Eu preparo uma proposta de escopo e te mando até sexta.';

const fixture: Fixture = {
  heldOn: '2026-10-01',
  mission: null,
  responsibilities: ['Atender os clientes', 'Registrar no CRM', 'Validar as entregas'],
  history: [],
  openAgreements: [],
  expectedAgreements: [
    { keywords: ['proposta', 'escopo'], owner: 'report', dueDate: '2026-10-02' },
  ],
  maxExtraAgreements: 0,
  expectedPrevious: [],
};

const output = (agreements: AnalysisOutput['agreements']): AnalysisOutput => ({
  summary: 'x',
  themes: [],
  agreements,
  previous_agreements: [],
  development_signals: [],
  attention_points: [],
  next_questions: [],
  private_leader_notes: '',
  leader_feedback: {
    ...sampleLeaderFeedback,
    strengths: [{ point: 'Escuta ativa', evidence: '' }],
  },
});

const correct = {
  description: 'Enviar a Proposta de Escopo',
  owner: 'report' as const,
  due_date: '2026-10-02',
  evidence_excerpt: 'preparo uma proposta de escopo e te mando até sexta',
};

describe('evaluateAnalysis', () => {
  it('deve aprovar quando o combinado esperado aparece com dono, prazo e evidência corretos', () => {
    expect(evaluateAnalysis(output([correct]), fixture, transcript).passed).toBe(true);
  });

  it('deve apontar combinado esperado que faltou', () => {
    const result = evaluateAnalysis(output([]), fixture, transcript);

    expect(result.missingAgreements).toEqual(['proposta + escopo']);
    expect(result.passed).toBe(false);
  });

  it('deve apontar responsável e prazo errados', () => {
    const result = evaluateAnalysis(
      output([{ ...correct, owner: 'leader', due_date: null }]),
      fixture,
      transcript,
    );

    expect(result.wrongOwner).toHaveLength(1);
    expect(result.wrongDueDate).toHaveLength(1);
  });

  it('deve apontar combinado inventado e evidência que não está na transcrição', () => {
    const invented = {
      description: 'Contratar consultoria',
      owner: 'leader' as const,
      due_date: null,
      evidence_excerpt: 'vamos contratar uma consultoria externa',
    };

    const result = evaluateAnalysis(output([correct, invented]), fixture, transcript);

    expect(result.tooManyExtras).toBe(true);
    expect(result.evidenceNotInTranscript).toEqual(['Contratar consultoria']);
  });

  it('deve comparar o status dos combinados anteriores', () => {
    const withPrevious: Fixture = { ...fixture, expectedPrevious: [{ id: 'c-1', status: 'done' }] };
    const result = evaluateAnalysis(
      {
        ...output([correct]),
        previous_agreements: [{ id: 'c-1', suggested_status: 'in_progress', evidence: '' }],
      },
      withPrevious,
      transcript,
    );

    expect(result.previousMismatches).toEqual(['c-1: esperado done, veio in_progress']);
  });

  it('deve apontar resumo longo demais, feedback do líder vazio e evidência inventada nele', () => {
    const result = evaluateAnalysis(
      {
        ...output([correct]),
        summary: 'x'.repeat(701),
        leader_feedback: {
          overall: 'mixed',
          overall_note: 'ok',
          strengths: [],
          opportunities: [],
        },
      },
      fixture,
      transcript,
    );

    expect(result.summaryTooLong).toBe(true);
    expect(result.leaderFeedbackEmpty).toBe(true);

    const invented = evaluateAnalysis(
      {
        ...output([correct]),
        leader_feedback: {
          overall: 'went_well',
          overall_note: 'ok',
          strengths: [{ point: 'Escutou bem', evidence: 'frase que não existe na conversa' }],
          opportunities: [],
        },
      },
      fixture,
      transcript,
    );
    expect(invented.leaderEvidenceNotInTranscript).toEqual(['Escutou bem']);
    expect(invented.passed).toBe(false);
  });
});

describe('evaluateAnalysis — responsabilidades', () => {
  const withSignals = (refs: string[]) => ({
    ...output([correct]),
    development_signals: refs.map((ref) => ({
      responsibility_ref: ref,
      observation: 'Observação.',
      kind: 'neutral' as const,
    })),
  });

  it('deve aceitar referências da lista e FORA (sem diferenciar maiúsculas)', () => {
    const result = evaluateAnalysis(withSignals(['R1', 'r3', 'FORA']), fixture, transcript);

    expect(result.invalidSignalRefs).toEqual([]);
    expect(result.passed).toBe(true);
  });

  it('deve reprovar referência que não existe na lista enviada', () => {
    const result = evaluateAnalysis(withSignals(['R1', 'R9', 'Comunicação']), fixture, transcript);

    expect(result.invalidSignalRefs).toEqual(['R9', 'COMUNICAÇÃO']);
    expect(result.passed).toBe(false);
  });

  it('deve reprovar mais de 5 sinais', () => {
    const result = evaluateAnalysis(
      withSignals(['R1', 'R1', 'R2', 'R2', 'R3', 'R3']),
      fixture,
      transcript,
    );

    expect(result.tooManySignals).toBe(true);
    expect(result.passed).toBe(false);
  });

  it('deve cobrar as responsabilidades esperadas pela conversa', () => {
    const expecting = { ...fixture, expectedSignalRefs: ['R2', 'R3'] };

    const result = evaluateAnalysis(withSignals(['R3']), expecting, transcript);

    expect(result.missingSignalRefs).toEqual(['R2']);
    expect(result.passed).toBe(false);
  });
});
