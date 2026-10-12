import { describe, expect, it } from 'vitest';
import { normalizePage, toPage } from './pagination.js';

describe('normalizePage', () => {
  it('deve usar padrões e calcular skip', () => {
    expect(normalizePage()).toEqual({ page: 1, pageSize: 20, skip: 0, take: 20 });
    expect(normalizePage(3, 10)).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it('deve limitar o tamanho da página a 100 e a página mínima a 1', () => {
    expect(normalizePage(0, 500)).toEqual({ page: 1, pageSize: 100, skip: 0, take: 100 });
  });
});

describe('toPage', () => {
  it('deve montar data e meta', () => {
    expect(toPage(['a'], 1, 1, 20)).toEqual({
      data: ['a'],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
  });
});
