import { describe, expect, it } from 'vitest';
import { splitProposal } from './split-proposal.js';

const long = (label: string) =>
  `${label}: acompanhar e registrar os atendimentos até a resolução final do caso.`;

describe('splitProposal', () => {
  it('deve separar por parágrafos (linhas em branco) na ordem', () => {
    const result = splitProposal(`${long('A')}\n\n${long('B')}\n\n${long('C')}`);

    expect(result.responsibilities).toEqual([long('A'), long('B'), long('C')]);
    expect(result.mission).toBeUndefined();
    expect(result.leftOut).toEqual([]);
  });

  it('deve separar por linha quando não há linhas em branco', () => {
    const result = splitProposal(`${long('A')}\n${long('B')}\n${long('C')}`);

    expect(result.responsibilities).toHaveLength(3);
  });

  it('deve tirar marcadores e numeração do começo', () => {
    const result = splitProposal(
      `• ${long('A')}\n- ${long('B')}\n1. ${long('C')}\na) ${long('D')}`,
    );

    expect(result.responsibilities).toEqual([long('A'), long('B'), long('C'), long('D')]);
  });

  it('deve reconhecer a missão e o título "Responsabilidades"', () => {
    const result = splitProposal(
      `MISSÃO / FINALIDADE DO CARGO\n\nGarantir a melhor experiência do cliente em toda a jornada.\n\nRESPONSABILIDADES\n\n${long('A')}\n\n${long('B')}\n\n${long('C')}`,
    );

    expect(result.mission).toBe('Garantir a melhor experiência do cliente em toda a jornada.');
    expect(result.responsibilities).toEqual([long('A'), long('B'), long('C')]);
  });

  it('deve manter só as 10 primeiras e informar as que ficaram de fora', () => {
    const paragraphs = Array.from({ length: 12 }, (_, index) => long(`Item ${index + 1}`));

    const result = splitProposal(paragraphs.join('\n\n'));

    expect(result.responsibilities).toHaveLength(10);
    expect(result.leftOut).toEqual([paragraphs[10], paragraphs[11]]);
  });

  it('deve ignorar trechos curtos demais e repetidos', () => {
    const result = splitProposal(`ok\n\n${long('A')}\n\n${long('A')}\n\n${long('B')}`);

    expect(result.responsibilities).toEqual([long('A'), long('B')]);
  });

  it('deve devolver vazio para texto vazio', () => {
    expect(splitProposal('   ')).toEqual({ responsibilities: [], leftOut: [] });
  });
});
