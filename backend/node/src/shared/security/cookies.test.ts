import { describe, expect, it } from 'vitest';
import { parseCookies } from './cookies.js';

describe('parseCookies', () => {
  it('deve ler vários cookies e ignorar lixo', () => {
    expect(parseCookies('a=1; b=dois ; =x; solto')).toEqual({ a: '1', b: 'dois' });
  });

  it('deve manter o primeiro valor quando o nome se repete', () => {
    expect(parseCookies('a=1; a=2')).toEqual({ a: '1' });
  });

  it('deve devolver vazio sem cabeçalho', () => {
    expect(parseCookies(undefined)).toEqual({});
  });
});
