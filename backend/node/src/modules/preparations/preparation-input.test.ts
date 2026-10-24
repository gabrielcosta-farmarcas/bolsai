import { describe, expect, it } from 'vitest';
import { buildPreparationInput } from './preparation-input.js';

const base = {
  today: '2026-10-24',
  map: {
    version: 2,
    mission: 'Cuidar do cliente.',
    behaviors: 'Dá feedback com clareza.',
    responsibilities: [{ ref: 'R1', text: 'Atender os clientes.' }],
  },
  history: [],
  openAgreements: [],
  gaps: [],
};

describe('buildPreparationInput', () => {
  it('deve dizer que não há histórico e mandar o responsograma com os comportamentos', () => {
    const text = buildPreparationInput(base);
    expect(text).toContain('Nenhum encontro anterior revisado.');
    expect(text).toContain('R1: Atender os clientes.');
    expect(text).toContain('<comportamentos_desejados>');
    expect(text).toContain('Nenhum combinado em aberto.');
  });

  it('deve incluir encontros, combinados atrasados e responsabilidades pouco conversadas', () => {
    const text = buildPreparationInput({
      ...base,
      history: [
        {
          heldOn: '2026-10-10',
          summary: 'Falaram do projeto.',
          themes: [{ title: 'Projeto', detail: 'Escopo.' }],
          attentionPoints: ['Pessoa: proposta parada.'],
          leaderNotes: 'Perguntar da proposta.',
        },
      ],
      openAgreements: [
        { description: 'Enviar proposta', owner: 'report', dueDate: '2026-10-15', isOverdue: true },
      ],
      gaps: [{ title: 'Relatórios', text: 'Entregar relatórios.', lastDiscussedOn: null }],
    });
    expect(text).toContain('<encontro data="2026-10-10">');
    expect(text).toContain('- Projeto: Escopo.');
    expect(text).toContain('Perguntar da proposta.');
    expect(text).toContain('atrasado="sim"');
    expect(text).toContain('ultima_conversa="nunca"');
  });
});
