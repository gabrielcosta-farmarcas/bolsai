import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, hashSessionToken, loadKey, newSessionToken } from './session-crypto.js';

const key = loadKey(Buffer.alloc(32, 1).toString('base64'));
const otherKey = loadKey(Buffer.alloc(32, 2).toString('base64'));

describe('session-crypto', () => {
  it('deve cifrar e decifrar, sem deixar o texto aparecer', () => {
    const payload = encrypt('refresh-token-secreto', key);

    expect(payload).not.toContain('refresh-token-secreto');
    expect(decrypt(payload, key)).toBe('refresh-token-secreto');
  });

  it('deve gerar um resultado diferente a cada vez', () => {
    expect(encrypt('igual', key)).not.toBe(encrypt('igual', key));
  });

  it('deve recusar texto adulterado, de outra chave ou mal formado', () => {
    const payload = encrypt('segredo', key);
    const parts = payload.split('.');
    const tampered = [parts[0], parts[1], parts[2], 'AAAA' + (parts[3] ?? '').slice(4)].join('.');

    expect(decrypt(tampered, key)).toBeNull();
    expect(decrypt(payload, otherKey)).toBeNull();
    expect(decrypt('lixo', key)).toBeNull();
    expect(decrypt(`${payload}.extra`, key)).toBeNull();
  });

  it('deve exigir chave de 32 bytes', () => {
    expect(() => loadKey(Buffer.alloc(16).toString('base64'))).toThrow();
  });

  it('deve gerar tokens longos e únicos e guardar só o hash', () => {
    const a = newSessionToken();
    const b = newSessionToken();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(hashSessionToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(a)).not.toContain(a);
  });
});
