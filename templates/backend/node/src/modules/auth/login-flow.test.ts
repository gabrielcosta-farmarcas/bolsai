import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { newLoginSecrets, safeReturnTo } from './login-flow.js';

describe('newLoginSecrets', () => {
  it('deve gerar valores únicos e o desafio PKCE correto', () => {
    const a = newLoginSecrets();
    const b = newLoginSecrets();

    expect(a.state).not.toBe(b.state);
    expect(a.verifier.length).toBeGreaterThanOrEqual(43);
    expect(a.challenge).toBe(createHash('sha256').update(a.verifier).digest('base64url'));
  });
});

describe('safeReturnTo', () => {
  it('deve aceitar caminhos da própria tela', () => {
    expect(safeReturnTo('/pessoas?aba=combinados')).toBe('/pessoas?aba=combinados');
    expect(safeReturnTo('/encontros/123')).toBe('/encontros/123');
  });

  it.each([
    'https://mal.example',
    '//mal.example',
    '/\\mal.example',
    'pessoas',
    '/api/v1/direct-reports',
    '/login',
    '/ok\r\nSet-Cookie: x=1',
    `/${'a'.repeat(600)}`,
    42,
    undefined,
  ])('deve cair em / para %s', (value) => {
    expect(safeReturnTo(value)).toBe('/');
  });
});
