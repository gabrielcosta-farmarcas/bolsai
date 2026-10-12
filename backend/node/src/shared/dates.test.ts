import { describe, expect, it } from 'vitest';
import { fromCalendarDate, isOverdue, toCalendarDate, todayInSaoPaulo } from './dates.js';

describe('todayInSaoPaulo', () => {
  it('deve usar o dia de São Paulo, não o de UTC', () => {
    // 01:30 UTC de 02/10 ainda é 22:30 de 01/10 em São Paulo.
    expect(todayInSaoPaulo(new Date('2026-10-02T01:30:00.000Z'))).toBe('2026-10-01');
    expect(todayInSaoPaulo(new Date('2026-10-02T12:00:00.000Z'))).toBe('2026-10-02');
  });
});

describe('isOverdue', () => {
  it('deve considerar atrasado só o aberto com prazo anterior a hoje', () => {
    expect(isOverdue('2026-09-30', 'open', '2026-10-01')).toBe(true);
    expect(isOverdue('2026-10-01', 'open', '2026-10-01')).toBe(false);
    expect(isOverdue('2026-09-30', 'done', '2026-10-01')).toBe(false);
    expect(isOverdue('2026-09-30', 'cancelled', '2026-10-01')).toBe(false);
    expect(isOverdue(null, 'open', '2026-10-01')).toBe(false);
  });
});

describe('conversão de data de calendário', () => {
  it('deve converter ida e volta sem mudar de dia', () => {
    expect(toCalendarDate(fromCalendarDate('2026-10-15'))).toBe('2026-10-15');
    expect(toCalendarDate(null)).toBeNull();
  });
});
