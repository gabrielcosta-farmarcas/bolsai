import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { csrfProtection } from './csrf.js';

const ORIGIN = 'http://localhost:3000';

const run = (method: string, headers: Record<string, string>) => {
  const req = { method, get: (name: string) => headers[name.toLowerCase()] } as unknown as Request;
  const next = vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
  csrfProtection(ORIGIN)(req, {} as Response, next);
  return next as unknown as ReturnType<typeof vi.fn>;
};

describe('csrfProtection', () => {
  it('deve deixar leituras passarem', () => {
    expect(run('GET', {})).toHaveBeenCalledWith();
  });

  it('deve aceitar escrita com o cabeçalho e a origem certos', () => {
    const next = run('POST', { 'x-requested-with': 'bonsai', origin: ORIGIN });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ['sem cabeçalho', { origin: ORIGIN }],
    ['sem origem', { 'x-requested-with': 'bonsai' }],
    ['origem de outro site', { 'x-requested-with': 'bonsai', origin: 'https://mal.example' }],
    ['cabeçalho errado', { 'x-requested-with': 'xml', origin: ORIGIN }],
  ])('deve recusar escrita %s', (_name, headers) => {
    const next = run('DELETE', headers);
    const error = next.mock.calls[0]?.[0] as { statusCode: number; code: string };
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('CSRF_REJECTED');
  });
});
