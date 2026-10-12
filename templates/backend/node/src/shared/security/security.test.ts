import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ForbiddenError } from '../errors/forbidden-error.js';
import { UnauthorizedError } from '../errors/unauthorized-error.js';
import {
  canViewAgreement,
  canViewAnalysis,
  canViewDirectReport,
  canViewResponsibilityMap,
  canViewSession,
} from './authorization.js';
import { FIXED_LEADER_ID, getCurrentUser, runWithUser, type AuthUser } from './current-user.js';
import { leaderOnlyByDefault, requireRole } from './require-auth.js';

const user = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  sessionId: 's1',
  subject: 'u1',
  email: 'ana@empresa.com.br',
  name: 'Ana',
  roles: ['lider'],
  leaderId: FIXED_LEADER_ID,
  ...overrides,
});

describe('getCurrentUser', () => {
  it('deve devolver a líder da requisição atual', () => {
    expect(runWithUser(user(), () => getCurrentUser())).toEqual({ leaderId: FIXED_LEADER_ID });
  });

  it('deve dar 401 fora de uma requisição autenticada (nunca um líder padrão)', () => {
    expect(() => getCurrentUser()).toThrow(UnauthorizedError);
  });

  it('deve dar 403 para quem entrou sem ser líder', () => {
    expect(() =>
      runWithUser(user({ leaderId: null, roles: ['administrador'] }), () => getCurrentUser()),
    ).toThrow(ForbiddenError);
  });
});

describe('autorização por dono', () => {
  const OTHER = '00000000-0000-7000-8000-0000000000ff';
  const current = { leaderId: FIXED_LEADER_ID };
  const checks = [
    ['pessoa', canViewDirectReport],
    ['encontro', canViewSession],
    ['análise', canViewAnalysis],
    ['combinado', canViewAgreement],
    ['responsograma', canViewResponsibilityMap],
  ] as const;

  it.each(checks)('deve permitir só o dono ver %s', (_name, canView) => {
    expect(canView(current, { leaderId: FIXED_LEADER_ID })).toBe(true);
    expect(canView(current, { leaderId: OTHER })).toBe(false);
  });

  it.each(checks)(
    'deve negar %s quando falta o dono ou o usuário não tem líder',
    (_name, canView) => {
      expect(canView(current, { leaderId: '' })).toBe(false);
      expect(canView({ leaderId: '' }, { leaderId: '' })).toBe(false);
    },
  );
});

describe('requireRole', () => {
  const run = (roles: string[], required: string[]) => {
    const next = vi.fn();
    runWithUser(user({ roles }), () =>
      requireRole(...required)({} as Request, {} as Response, next),
    );
    return next.mock.calls[0]?.[0] as { statusCode?: number; code?: string } | undefined;
  };

  it('deve deixar passar quem tem um dos papéis', () => {
    expect(run(['lider'], ['lider'])).toBeUndefined();
    expect(run(['lider', 'administrador'], ['administrador'])).toBeUndefined();
  });

  it('deve dar 403 a quem não tem o papel', () => {
    expect(run(['administrador'], ['lider'])).toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(run([], ['lider'])).toMatchObject({ statusCode: 403 });
  });
});

describe('leaderOnlyByDefault', () => {
  const run = (path: string, roles: string[], allowed: string[] = []) => {
    const next = vi.fn();
    runWithUser(user({ roles }), () =>
      leaderOnlyByDefault(allowed)({ path } as Request, {} as Response, next),
    );
    return next.mock.calls[0]?.[0] as { statusCode?: number } | undefined;
  };

  it('deve exigir o papel lider em qualquer rota nova, sem precisar lembrar', () => {
    expect(run('/direct-reports', ['administrador'])).toMatchObject({ statusCode: 403 });
    expect(run('/rota-que-ainda-nao-existe', ['liderado'])).toMatchObject({ statusCode: 403 });
    expect(run('/direct-reports', ['lider'])).toBeUndefined();
  });

  it('deve liberar só os caminhos listados, a quem estiver logado', () => {
    expect(run('/me/summary', ['liderado'], ['/me'])).toBeUndefined();
    expect(run('/mensagens', ['liderado'], ['/me'])).toMatchObject({ statusCode: 403 });
  });
});
