import { render, screen, within } from '@testing-library/react';
import { EvolutionLegend } from './EvolutionLegend';

describe('EvolutionLegend', () => {
  it('deve explicar os três tipos de marcador com nome e significado, não só com cor', () => {
    render(<EvolutionLegend />);

    const list = screen.getByRole('list', { name: 'Legenda dos marcadores' });
    const items = within(list).getAllByRole('listitem');

    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Evolução: houve avanço, com evidência na conversa');
    expect(items[1]).toHaveTextContent('Ponto de atenção: pede apoio ou acompanhamento');
    expect(items[2]).toHaveTextContent('Neutro: foi tratada, sem avanço nem alerta');
  });

  it('deve explicar que cada marcador é um encontro em que a responsabilidade foi citada', () => {
    render(<EvolutionLegend />);

    expect(
      screen.getByText(/Cada marcador é um encontro em que a responsabilidade foi citada/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Passe o mouse no título/)).toBeInTheDocument();
  });
});
