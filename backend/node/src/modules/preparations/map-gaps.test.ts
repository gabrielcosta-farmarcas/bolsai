import { describe, expect, it } from 'vitest';
import { computeMapGaps } from './map-gaps.js';

const active = [
  { id: 'a', title: 'Atendimento' },
  { id: 'b', title: 'Relatórios' },
  { id: 'c', title: 'Processos' },
];
const session = (heldOn: string, ...ids: string[]) => ({ heldOn, discussedIds: new Set(ids) });

describe('computeMapGaps', () => {
  it('deve devolver lista vazia quando não há histórico', () => {
    expect(computeMapGaps(active, [])).toEqual([]);
  });

  it('deve apontar as responsabilidades que não apareceram nos últimos 3 encontros', () => {
    const history = [
      session('2026-10-10', 'a'),
      session('2026-10-01', 'a'),
      session('2026-09-20', 'a'),
    ];
    expect(computeMapGaps(active, history)).toEqual([
      { responsibilityId: 'b', title: 'Relatórios', lastDiscussedOn: null },
      { responsibilityId: 'c', title: 'Processos', lastDiscussedOn: null },
    ]);
  });

  it('deve contar como lacuna quem só apareceu antes da janela e informar a data da última conversa', () => {
    const history = [
      session('2026-10-10', 'a'),
      session('2026-10-01', 'a', 'c'),
      session('2026-09-20', 'a'),
      session('2026-09-01', 'b'),
    ];
    expect(computeMapGaps(active, history)).toEqual([
      { responsibilityId: 'b', title: 'Relatórios', lastDiscussedOn: '2026-09-01' },
    ]);
  });

  it('deve olhar só os encontros existentes quando há menos de 3', () => {
    expect(computeMapGaps(active, [session('2026-10-10', 'a', 'b')])).toEqual([
      { responsibilityId: 'c', title: 'Processos', lastDiscussedOn: null },
    ]);
  });
});
