import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Timeline } from './Timeline';
import type { Timeline as TimelineData } from '../types';

const data: TimelineData = {
  entries: [
    {
      sessionId: 's1',
      heldOn: '2026-09-10',
      isReviewed: true,
      summary: 'Primeiro encontro.',
      themes: [],
      signals: [
        {
          responsibilityId: 'q1',
          responsibility: 'Comunicação',
          observation: 'Expôs ideias.',
          kind: 'attention',
        },
      ],
      agreements: [
        {
          id: 'g1',
          description: 'Revisar o painel',
          owner: 'report',
          dueDate: null,
          status: 'done',
          isOverdue: false,
        },
      ],
    },
    {
      sessionId: 's2',
      heldOn: '2026-10-01',
      isReviewed: false,
      summary: 'Segundo encontro.',
      themes: [],
      signals: [
        {
          responsibilityId: 'q1',
          responsibility: 'Comunicação',
          observation: 'Mais clareza.',
          kind: 'growth',
        },
      ],
      agreements: [
        {
          id: 'g2',
          description: 'Escrever a documentação',
          owner: 'report',
          dueDate: '2026-10-02',
          status: 'open',
          isOverdue: true,
        },
      ],
    },
  ],
  responsibilities: [
    {
      id: 'q1',
      responsibility: 'Comunicação',
      text: 'Comunicar-se com produto e engenharia, alinhando decisões de design.',
      points: [
        { sessionId: 's1', heldOn: '2026-09-10', kind: 'attention' },
        { sessionId: 's2', heldOn: '2026-10-01', kind: 'growth' },
      ],
    },
  ],
  totals: { agreements: 2, done: 1, open: 1, cancelled: 0, overdue: 1 },
};

const renderTimeline = (props: Partial<Parameters<typeof Timeline>[0]> = {}) =>
  render(
    <MemoryRouter>
      <Timeline timeline={data} isLoading={false} onRetry={() => {}} {...props} />
    </MemoryRouter>,
  );

describe('Timeline', () => {
  it('deve resumir em frase e mostrar o mais recente primeiro', () => {
    renderTimeline();

    expect(
      screen.getByText('2 encontros e 2 combinados: 1 cumprido, 1 em aberto, 1 atrasado.'),
    ).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual([
      'quinta-feira, 1 de outubro de 2026',
      'quinta-feira, 10 de setembro de 2026',
    ]);
  });

  it('deve descrever a evolução por texto, não só por cor', () => {
    renderTimeline();

    expect(screen.getByText('10/09/2026: ponto de atenção')).toBeInTheDocument();
    expect(screen.getByText('01/10/2026: evolução')).toBeInTheDocument();
  });

  it('deve mostrar combinados cumpridos e atrasados em cada encontro', () => {
    renderTimeline();

    const second = screen.getAllByRole('article')[0];
    expect(within(second as HTMLElement).getByText('Atrasado')).toBeInTheDocument();
    expect(
      within(second as HTMLElement).getByText('0 de 1 combinado cumprido'),
    ).toBeInTheDocument();
    expect(screen.getByText('1 de 1 combinado cumprido')).toBeInTheDocument();
  });

  it('deve mostrar o carregamento, o erro e o vazio', () => {
    const { unmount } = renderTimeline({ timeline: undefined, isLoading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Carregando');
    unmount();

    const failed = renderTimeline({ timeline: undefined, errorMessage: 'Falhou' });
    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
    failed.unmount();

    renderTimeline({ timeline: { ...data, entries: [] } });
    expect(screen.getByText(/A linha do tempo começa no primeiro encontro/)).toBeInTheDocument();
  });
});
