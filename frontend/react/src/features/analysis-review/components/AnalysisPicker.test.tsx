import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisPicker } from './AnalysisPicker';
import type { AnalysisSummary } from '../types';

const analysis = (overrides: Partial<AnalysisSummary>): AnalysisSummary => ({
  id: 'a1',
  sessionId: 's1',
  model: null,
  status: 'completed',
  errorMessage: null,
  mapVersionUsed: null,
  isFinal: false,
  reviewedAt: null,
  createdAt: '2026-10-01T15:00:00.000Z',
  ...overrides,
});

describe('AnalysisPicker', () => {
  it('deve marcar a versão final e a selecionada, e avisar a escolha', async () => {
    const onSelect = vi.fn();
    render(
      <AnalysisPicker
        analyses={[analysis({ id: 'a2' }), analysis({ id: 'a1', isFinal: true })]}
        selectedId="a1"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole('button', { name: /versão final/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: /Análise 2/ }));
    expect(onSelect).toHaveBeenCalledWith('a2');
  });
});
