import { firstName, formatCalendarDate, formatLongDate } from './format';

describe('formatCalendarDate', () => {
  it('deve trocar AAAA-MM-DD por DD/MM/AAAA', () => {
    expect(formatCalendarDate('2025-03-10')).toBe('10/03/2025');
  });
});

describe('formatLongDate', () => {
  it('deve escrever a data por extenso sem mudar de dia', () => {
    expect(formatLongDate('2026-10-01')).toBe('quinta-feira, 1 de outubro de 2026');
  });
});

describe('firstName', () => {
  it('deve devolver só o primeiro nome', () => {
    expect(firstName('Gabriel Costa')).toBe('Gabriel');
    expect(firstName('  maria   da Silva ')).toBe('Maria');
  });

  it('deve devolver vazio sem nome', () => {
    expect(firstName(null)).toBe('');
    expect(firstName(undefined)).toBe('');
    expect(firstName('   ')).toBe('');
  });
});
