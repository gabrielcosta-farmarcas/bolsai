import { withSavedAgreements, type AgreementRow } from './mergeAgreements';
import type { AnalysisContent } from '../types';

const content: AnalysisContent = {
  summary: 'x',
  themes: [],
  agreements: [
    { description: 'Do JSON', owner: 'report', due_date: null, evidence_excerpt: 'trecho' },
  ],
  previous_agreements: [],
  development_signals: [],
  attention_points: [],
  next_questions: [],
  private_leader_notes: '',
};

const row = (overrides: Partial<AgreementRow> = {}): AgreementRow => ({
  id: 'g1',
  analysisId: 'a1',
  description: 'Salvo no banco',
  owner: 'leader',
  dueDate: '2026-10-20',
  evidenceExcerpt: null,
  status: 'open',
  ...overrides,
});

describe('withSavedAgreements', () => {
  it('deve usar os combinados salvos (com id) na análise que os gerou', () => {
    const merged = withSavedAgreements(
      content,
      [row(), row({ id: 'g2', status: 'cancelled' })],
      'a1',
      false,
    );

    expect(merged.agreements).toEqual([
      {
        id: 'g1',
        description: 'Salvo no banco',
        owner: 'leader',
        due_date: '2026-10-20',
        evidence_excerpt: '',
      },
    ]);
  });

  it('deve usar também na versão final, mesmo de outra análise', () => {
    expect(
      withSavedAgreements(content, [row({ analysisId: 'outra' })], 'a1', true).agreements[0]?.id,
    ).toBe('g1');
  });

  it('deve manter o conteúdo da análise quando ela não gerou os combinados e não é a final', () => {
    expect(withSavedAgreements(content, [row({ analysisId: 'outra' })], 'a1', false)).toBe(content);
  });

  it('deve manter o conteúdo enquanto os combinados não carregaram', () => {
    expect(withSavedAgreements(content, undefined, 'a1', true)).toBe(content);
  });
});
