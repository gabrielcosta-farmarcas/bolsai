import { render, screen } from '@testing-library/react';
import { TranscriptPane } from './TranscriptPane';

const transcript = 'Gestor: Ana, como ficou?\nAna: Já terminei e publiquei. Os números batem.';

describe('TranscriptPane', () => {
  it('deve mostrar as falas com o falante em destaque e marcar o trecho citado', () => {
    render(
      <TranscriptPane
        transcript={transcript}
        evidence={[{ key: 'ag1', text: 'Já terminei e publiquei.' }]}
      />,
    );

    expect(screen.getByText('Gestor:')).toBeInTheDocument();
    const mark = screen.getByText('Já terminei e publiquei.');
    expect(mark.tagName).toBe('MARK');
    expect(mark).toHaveAttribute('data-evidence', 'ag1');
  });

  it('deve realçar só o trecho ativo', () => {
    render(
      <TranscriptPane
        transcript={transcript}
        evidence={[{ key: 'ag1', text: 'Já terminei e publiquei.' }]}
        activeKey="ag1"
      />,
    );

    expect(screen.getByText('Já terminei e publiquei.').className).toContain('outline-accent');
  });
});
