import { describe, expect, it } from 'vitest';
import {
  MAX_RESPONSIBILITIES,
  MAX_RESPONSIBILITY_LENGTH,
  MIN_RESPONSIBILITIES,
  checkResponsibilities,
} from './responsibilities.schemas.js';

const texts = (count: number) =>
  Array.from({ length: count }, (_, index) => `Responsabilidade número ${index + 1}`);

const failure = (raw: string[]) => {
  try {
    checkResponsibilities(raw);
  } catch (error) {
    return error as { statusCode: number; code: string; message: string };
  }
  return undefined;
};

describe('checkResponsibilities', () => {
  it('deve aceitar de 3 a 10 e devolver textos aparados com a chave', () => {
    const result = checkResponsibilities([
      '  Atender os clientes  ',
      'Registrar no CRM',
      'Validar entregas',
    ]);

    expect(result.items.map((item) => item.text)).toEqual([
      'Atender os clientes',
      'Registrar no CRM',
      'Validar entregas',
    ]);
    expect(result.items[0]?.key).toBe('atender os clientes');
    expect(result.duplicates).toBe(0);
    expect(checkResponsibilities(texts(MAX_RESPONSIBILITIES)).items).toHaveLength(10);
  });

  it('deve ignorar campos vazios e manter a ordem', () => {
    const result = checkResponsibilities([
      'A responsabilidade um',
      '',
      '   ',
      'B responsabilidade dois',
      'C responsabilidade três',
    ]);

    expect(result.items.map((item) => item.text[0])).toEqual(['A', 'B', 'C']);
  });

  it('deve dizer quantas faltam quando há menos de 3', () => {
    expect(failure(texts(2))).toMatchObject({
      statusCode: 422,
      code: 'TOO_FEW_RESPONSIBILITIES',
      message: 'Preencha pelo menos 3 responsabilidades. Falta 1.',
    });
    expect(failure([])?.message).toBe('Preencha pelo menos 3 responsabilidades. Faltam 3.');
    expect(MIN_RESPONSIBILITIES).toBe(3);
  });

  it('deve recusar mais de 10', () => {
    expect(failure(texts(11))).toMatchObject({
      statusCode: 422,
      code: 'TOO_MANY_RESPONSIBILITIES',
    });
  });

  it('deve recusar texto curto demais ou longo demais, dizendo qual campo', () => {
    expect(failure(['ok', ...texts(3)])).toMatchObject({ code: 'INVALID_RESPONSIBILITY' });
    expect(failure(['ok', ...texts(3)])?.message).toContain('Responsabilidade 1');
    const long = 'x'.repeat(MAX_RESPONSIBILITY_LENGTH + 1);
    expect(failure([...texts(3), long])?.message).toContain('Responsabilidade 4');
  });

  it('deve juntar repetidos (mesmo texto ignorando maiúsculas e espaços) e contar o aviso', () => {
    const result = checkResponsibilities([
      'Atender os clientes',
      'ATENDER  os clientes',
      'Registrar no CRM',
      'Validar entregas',
    ]);

    expect(result.items).toHaveLength(3);
    expect(result.duplicates).toBe(1);
  });

  it('deve contar só as diferentes para o mínimo (3 iguais valem como 1)', () => {
    expect(failure(['Mesmo texto aqui', 'mesmo texto AQUI', 'Mesmo  texto aqui'])).toMatchObject({
      code: 'TOO_FEW_RESPONSIBILITIES',
    });
  });
});
