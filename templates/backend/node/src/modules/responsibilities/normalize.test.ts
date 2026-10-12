import { describe, expect, it } from 'vitest';
import { normalizeKey, provisionalTitle } from './normalize.js';

describe('normalizeKey', () => {
  it('deve ignorar maiúsculas e espaços sobrando', () => {
    expect(normalizeKey('  Registrar   e controlar o FLUXO ')).toBe(
      'registrar e controlar o fluxo',
    );
    expect(normalizeKey('a\tb\nc')).toBe('a b c');
  });

  it('deve tratar o mesmo acento escrito de dois jeitos como igual', () => {
    expect(normalizeKey('Comunicação')).toBe(normalizeKey('Comunicação'));
  });

  it('não deve ignorar acentos (palavras diferentes continuam diferentes)', () => {
    expect(normalizeKey('sabia')).not.toBe(normalizeKey('sabiá'));
  });
});

describe('provisionalTitle', () => {
  it('deve usar a frase inteira quando é curta', () => {
    expect(provisionalTitle('Atender clientes')).toBe('Atender clientes');
  });

  it('deve cortar em palavra inteira, com reticências, até 60 caracteres', () => {
    const title = provisionalTitle(
      'Mapear e atuar na resolução de pontos de atrito identificados na jornada do cliente',
    );

    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith('…')).toBe(true);
    expect(title).toBe('Mapear e atuar na resolução de pontos de atrito…');
  });

  it('deve cortar a palavra gigante se não houver espaço', () => {
    const title = provisionalTitle('x'.repeat(200));

    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith('…')).toBe(true);
  });

  it('deve colapsar espaços e quebras de linha', () => {
    expect(provisionalTitle('  Atender\n\nclientes  ')).toBe('Atender clientes');
  });
});
