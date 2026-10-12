import { describe, expect, it } from 'vitest';
import { dropRepeatedActions, isSameAction } from './similarity.js';

describe('isSameAction', () => {
  it('reconhece a mesma ação dita com outras palavras (caso real do Haiku)', () => {
    expect(
      isSameAction(
        'Testar o Impulso corrigido na próxima agenda do 1:1.',
        'Testar o Impulso corrigido, com a próxima agenda já caminhando para os resultados.',
      ),
    ).toBe(true);
  });

  it('ignora acento, caixa e pontuação', () => {
    expect(isSameAction('Agendar a reunião com o Jurídico!', 'agendar reuniao com juridico')).toBe(
      true,
    );
  });

  it('não confunde ações parecidas, mas diferentes', () => {
    expect(isSameAction('Enviar relatório de vendas', 'Enviar relatório de compras')).toBe(false);
    expect(isSameAction('Marcar reunião com o RH', 'Marcar reunião com o financeiro')).toBe(false);
    expect(isSameAction('Enviar proposta', 'Enviar relatório')).toBe(false);
    expect(isSameAction('Revisar o contrato', 'Assinar o contrato')).toBe(false);
  });

  it('trata textos curtos iguais como a mesma ação e vazio como diferente', () => {
    expect(isSameAction('Enviar proposta', 'Enviar a proposta.')).toBe(true);
    expect(isSameAction('', 'Enviar proposta')).toBe(false);
    expect(isSameAction('o a de', 'o a de')).toBe(false);
  });
});

describe('dropRepeatedActions', () => {
  const item = (description: string, owner: 'leader' | 'report' = 'report') => ({
    description,
    owner,
  });

  it('descarta repetido dentro da própria lista, mesmo com responsável diferente', () => {
    const { kept, dropped } = dropRepeatedActions(
      [
        item('Testar o Impulso corrigido na próxima agenda do 1:1.', 'leader'),
        item('Testar o Impulso corrigido, com a próxima agenda já caminhando.', 'report'),
        item('Enviar o plano de carreira revisado ao gestor'),
      ],
      [],
    );

    expect(kept.map((entry) => entry.owner)).toEqual(['leader', 'report']);
    expect(kept[0]?.description).toContain('Impulso');
    expect(dropped).toHaveLength(1);
  });

  it('descarta o que já existe em aberto e mantém a ordem do resto', () => {
    const { kept, dropped } = dropRepeatedActions(
      [
        item('Homologar a ferramenta Impulso, fazendo o teste com a área.'),
        item('Marcar o curso de liderança para o próximo trimestre'),
      ],
      ['Homologar a ferramenta Impulso com a área, fazendo o teste.'],
    );

    expect(kept.map((entry) => entry.description)).toEqual([
      'Marcar o curso de liderança para o próximo trimestre',
    ]);
    expect(dropped).toHaveLength(1);
  });
});
