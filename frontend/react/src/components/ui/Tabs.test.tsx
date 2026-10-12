import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Tabs } from './Tabs';

function Harness() {
  const [selectedId, setSelectedId] = useState('a');
  return (
    <Tabs
      label="Seções"
      selectedId={selectedId}
      onSelect={setSelectedId}
      items={[
        { id: 'a', label: 'Encontros', count: 3, content: <p>Conteúdo A</p> },
        { id: 'b', label: 'Responsograma', content: <p>Conteúdo B</p> },
        { id: 'c', label: 'Outra', content: <p>Conteúdo C</p> },
      ]}
    />
  );
}

describe('Tabs', () => {
  it('deve mostrar só o painel da aba selecionada e o contador', () => {
    render(<Harness />);

    expect(screen.getByRole('tab', { name: /Encontros/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo A')).toBeInTheDocument();
    expect(screen.queryByText('Conteúdo B')).not.toBeInTheDocument();
  });

  it('deve trocar de aba ao clicar', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('tab', { name: 'Responsograma' }));

    expect(screen.getByText('Conteúdo B')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Responsograma');
  });

  it('deve navegar com as setas, Home e End movendo o foco', async () => {
    render(<Harness />);

    screen.getByRole('tab', { name: /Encontros/ }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Responsograma' })).toHaveFocus();

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Outra' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /Encontros/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Outra' })).toHaveFocus();
  });
});
