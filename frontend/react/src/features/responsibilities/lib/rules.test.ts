import {
  FIELD_COUNT,
  MIN_RESPONSIBILITIES,
  countFilled,
  duplicateCount,
  emptyFields,
  fieldsFrom,
  filledTexts,
  rulesMessage,
} from './rules';

const fields = (...texts: string[]) => fieldsFrom(texts);

describe('emptyFields e fieldsFrom', () => {
  it('deve ter sempre 10 campos', () => {
    expect(emptyFields()).toHaveLength(FIELD_COUNT);
    expect(fields('a', 'b')).toHaveLength(10);
    expect(fieldsFrom(Array.from({ length: 14 }, (_, i) => `r${i}`))).toHaveLength(10);
  });

  it('deve preencher do começo e deixar o resto vazio', () => {
    const result = fields('Um', 'Dois');

    expect(result.slice(0, 3)).toEqual(['Um', 'Dois', '']);
  });
});

describe('contagem', () => {
  it('deve contar só os campos preenchidos (espaços não contam)', () => {
    expect(countFilled(fields('Atender os clientes', '   ', 'Registrar no CRM'))).toBe(2);
  });

  it('deve devolver os textos preenchidos aparados, na ordem', () => {
    expect(filledTexts(fields('  Um texto ', '', 'Outro texto'))).toEqual([
      'Um texto',
      'Outro texto',
    ]);
  });

  it('deve contar repetidos ignorando maiúsculas e espaços', () => {
    expect(duplicateCount(fields('Atender os clientes', 'ATENDER  os clientes', 'Outro'))).toBe(1);
    expect(duplicateCount(fields('A responsabilidade', 'B responsabilidade'))).toBe(0);
  });
});

describe('rulesMessage', () => {
  it('deve dizer quantas faltam, no singular e no plural', () => {
    expect(rulesMessage(fields('Uma', 'Duas'))).toBe(
      'Preencha pelo menos 3 responsabilidades. Falta 1.',
    );
    expect(rulesMessage(emptyFields())).toBe('Preencha pelo menos 3 responsabilidades. Faltam 3.');
  });

  it('não deve contar repetidos para o mínimo', () => {
    expect(rulesMessage(fields('Mesmo texto aqui', 'mesmo TEXTO aqui', 'Outro texto aqui'))).toBe(
      'Preencha pelo menos 3 responsabilidades. Falta 1.',
    );
  });

  it('deve apontar o campo curto ou longo demais', () => {
    expect(rulesMessage(fields('ok', 'Segundo texto', 'Terceiro texto', 'Quarto texto'))).toBe(
      'Responsabilidade 1: escreva de 3 a 1000 caracteres.',
    );
    expect(
      rulesMessage(fields('Primeiro texto', 'Segundo texto', 'Terceiro texto', 'x'.repeat(1001))),
    ).toBe('Responsabilidade 4: escreva de 3 a 1000 caracteres.');
  });

  it('deve devolver nada quando está tudo certo', () => {
    expect(
      rulesMessage(fields('Primeiro texto', 'Segundo texto', 'Terceiro texto')),
    ).toBeUndefined();
    expect(MIN_RESPONSIBILITIES).toBe(3);
  });
});
