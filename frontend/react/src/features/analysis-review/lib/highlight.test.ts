import { highlightTranscript } from './highlight';

const transcript = [
  'Gestor: Ana, como ficou o painel?',
  'Ana: Já terminei e publiquei. Os números batem.',
  'Ana: Vou escrever a primeira versão até dia 15.',
].join('\n');

describe('highlightTranscript', () => {
  it('deve separar o falante e marcar o trecho citado', () => {
    const lines = highlightTranscript(transcript, [{ key: 'a', text: 'Já terminei e publiquei.' }]);

    expect(lines).toHaveLength(3);
    expect(lines[1]?.speaker).toBe('Ana:');
    expect(lines[1]?.segments).toEqual([
      { text: 'Já terminei e publiquei.', key: 'a' },
      { text: ' Os números batem.' },
    ]);
  });

  it('deve ignorar aspas, caixa e espaços diferentes na citação da IA', () => {
    const lines = highlightTranscript(transcript, [
      { key: 'b', text: '“vou escrever  a primeira versão até dia 15”' },
    ]);

    expect(lines[2]?.segments.find((segment) => segment.key === 'b')?.text).toBe(
      'Vou escrever a primeira versão até dia 15',
    );
  });

  it('não deve marcar trecho que não está na conversa', () => {
    const lines = highlightTranscript(transcript, [{ key: 'x', text: 'texto inventado' }]);

    expect(lines.flatMap((line) => line.segments).some((segment) => segment.key)).toBe(false);
  });

  it('deve marcar cada trecho só na primeira ocorrência', () => {
    const repeated = 'Ana: sim, combinado.\nAna: sim, combinado.';

    const lines = highlightTranscript(repeated, [{ key: 'c', text: 'sim, combinado' }]);

    expect(lines[0]?.segments.some((segment) => segment.key === 'c')).toBe(true);
    expect(lines[1]?.segments.some((segment) => segment.key === 'c')).toBe(false);
  });

  it('deve funcionar com linha sem falante', () => {
    const lines = highlightTranscript('Texto corrido sem nome', []);

    expect(lines).toEqual([{ speaker: undefined, segments: [{ text: 'Texto corrido sem nome' }] }]);
  });
});
