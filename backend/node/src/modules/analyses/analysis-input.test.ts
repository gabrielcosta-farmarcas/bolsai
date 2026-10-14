import { describe, expect, it } from 'vitest';
import { buildAnalysisInput } from './analysis-input.js';

const base = {
  heldOn: '2026-10-11',
  transcript: 'Conversa de teste.',
  history: [],
  openAgreements: [],
};

const responsibilities = [
  { ref: 'R1', text: 'Mapear e atuar na resolução de pontos de atrito na jornada do cliente.' },
  { ref: 'R2', text: 'Prestar atendimento e suporte técnico-operacional aos clientes.' },
  { ref: 'R3', text: 'Acompanhar a implementação de soluções e ajustes.' },
  { ref: 'R4', text: 'Registrar e controlar o fluxo de demandas via CRM.' },
];

describe('buildAnalysisInput — responsograma', () => {
  it('deve enviar TODAS as responsabilidades, numeradas, com o texto completo e na ordem', () => {
    const input = buildAnalysisInput({
      ...base,
      map: { version: 2, mission: null, responsibilities },
    });

    for (const item of responsibilities) expect(input).toContain(`${item.ref}: ${item.text}`);
    const positions = responsibilities.map((item) => input.indexOf(`${item.ref}: `));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(input).toContain('<responsograma versao="2">');
    expect(input).toContain('<responsabilidades>');
  });

  it('não deve cortar nem resumir uma responsabilidade longa (até 1.000 caracteres)', () => {
    const long = `Atender ${'com atenção '.repeat(80)}`.slice(0, 1000);

    const input = buildAnalysisInput({
      ...base,
      map: {
        version: 1,
        mission: null,
        responsibilities: [{ ref: 'R1', text: long }, ...responsibilities.slice(1)],
      },
    });

    expect(input).toContain(`R1: ${long}`);
  });

  it('deve incluir a missão só quando existe', () => {
    const withMission = buildAnalysisInput({
      ...base,
      map: { version: 1, mission: ' Garantir a melhor experiência. ', responsibilities },
    });
    const without = buildAnalysisInput({
      ...base,
      map: { version: 1, mission: '  ', responsibilities },
    });

    expect(withMission).toContain('<missao>\nGarantir a melhor experiência.\n</missao>');
    expect(without).not.toContain('<missao>');
  });

  it('deve incluir os comportamentos desejados depois das responsabilidades, só quando existem', () => {
    const withBehaviors = buildAnalysisInput({
      ...base,
      map: {
        version: 1,
        mission: null,
        behaviors: ' Pensamento crítico\nEmpatia ',
        responsibilities,
      },
    });
    const without = buildAnalysisInput({
      ...base,
      map: { version: 1, mission: null, behaviors: '  ', responsibilities },
    });
    const legacy = buildAnalysisInput({
      ...base,
      map: { version: 1, mission: null, responsibilities },
    });

    expect(withBehaviors).toContain(
      '</responsabilidades>\n<comportamentos_desejados>\nPensamento crítico\nEmpatia\n</comportamentos_desejados>\n</responsograma>',
    );
    expect(without).not.toContain('<comportamentos_desejados>');
    expect(legacy).not.toContain('<comportamentos_desejados>');
  });

  it('deve manter a transcrição, o histórico e os combinados em aberto em seções separadas', () => {
    const input = buildAnalysisInput({
      ...base,
      map: { version: 1, mission: null, responsibilities },
      history: [{ heldOn: '2026-09-01', summary: 'Resumo anterior.' }],
      openAgreements: [
        { id: 'a1', description: 'Enviar a proposta', owner: 'report', dueDate: null },
      ],
    });

    expect(input).toContain('<historico>');
    expect(input).toContain(
      '<combinado id="a1" responsavel="report" prazo="sem prazo">Enviar a proposta</combinado>',
    );
    expect(input).toContain(
      '<transcricao data_do_encontro="2026-10-11">\nConversa de teste.\n</transcricao>',
    );
  });

  it('deve avisar quando não há responsograma', () => {
    expect(buildAnalysisInput({ ...base, map: null })).toContain(
      'Nenhum responsograma cadastrado.',
    );
  });
});
