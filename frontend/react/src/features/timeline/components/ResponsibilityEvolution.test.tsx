import { render, screen } from '@testing-library/react';
import { ResponsibilityEvolution } from './ResponsibilityEvolution';

const items = [
  {
    id: 'q1',
    responsibility: 'Pontos de atrito',
    text: 'Mapear e atuar na resolução de pontos de atrito identificados na jornada do cliente.',
    points: [{ sessionId: 's1', heldOn: '2026-10-01', kind: 'growth' as const }],
  },
  {
    id: null,
    responsibility: 'Fora das responsabilidades',
    text: null,
    points: [{ sessionId: 's1', heldOn: '2026-10-01', kind: 'attention' as const }],
  },
];

describe('ResponsibilityEvolution', () => {
  it('deve mostrar a frase completa da responsabilidade ao passar o mouse ou focar no título', () => {
    render(<ResponsibilityEvolution responsibilities={items} />);

    const trigger = screen.getByText('Pontos de atrito');
    const balloon = screen.getByRole('tooltip');

    expect(balloon).toHaveTextContent(
      'Mapear e atuar na resolução de pontos de atrito identificados na jornada do cliente.',
    );
    expect(trigger).toHaveAttribute('aria-describedby', balloon.id);
  });

  it('não deve criar balão quando não há frase (fora das responsabilidades)', () => {
    render(<ResponsibilityEvolution responsibilities={items.slice(1)} />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.getByText('Fora das responsabilidades')).toBeInTheDocument();
  });

  it('deve manter uma camada por encontro com o rótulo para leitores de tela', () => {
    render(<ResponsibilityEvolution responsibilities={items.slice(0, 1)} />);

    expect(screen.getByText(/01\/10\/2026: evolução/i)).toBeInTheDocument();
  });

  it('deve avisar quando ainda não há evolução', () => {
    render(<ResponsibilityEvolution responsibilities={[]} />);

    expect(screen.getByText(/depois do primeiro encontro analisado/)).toBeInTheDocument();
  });
});
