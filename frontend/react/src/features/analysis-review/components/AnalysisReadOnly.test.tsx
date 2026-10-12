import { render, screen } from '@testing-library/react';
import { AnalysisReadOnly } from './AnalysisReadOnly';
import type { AnalysisContent } from '../types';

const content: AnalysisContent = {
  summary: 'Resumo.',
  themes: [],
  agreements: [],
  previous_agreements: [],
  development_signals: [
    { responsibility_id: 'q1', observation: 'Mapeou um atrito.', kind: 'growth' },
    { responsibility_id: null, observation: 'Falou de carreira.', kind: 'neutral' },
    { responsibility_id: 'q-sumiu', observation: 'Algo antigo.', kind: 'attention' },
  ],
  attention_points: [],
  next_questions: [],
  private_leader_notes: '',
};

describe('AnalysisReadOnly — sinais por responsabilidade', () => {
  it('deve mostrar o título da responsabilidade, "fora" e "removida"', () => {
    render(
      <AnalysisReadOnly
        content={content}
        responsibilities={[{ id: 'q1', title: 'Pontos de atrito', retired: false }]}
      />,
    );

    expect(screen.getByText('Pontos de atrito:')).toBeInTheDocument();
    expect(screen.getByText('Fora das responsabilidades:')).toBeInTheDocument();
    expect(screen.getByText('Responsabilidade removida:')).toBeInTheDocument();
    expect(screen.getByText(/Mapeou um atrito\./)).toBeInTheDocument();
  });
});
