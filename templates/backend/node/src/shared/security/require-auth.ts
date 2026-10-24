import type { RequestHandler } from 'express';
import type { SessionService } from '../../modules/auth/session.service.js';
import { UnauthorizedError } from '../errors/unauthorized-error.js';
import { ForbiddenError } from '../errors/forbidden-error.js';
import { SESSION_COOKIE, parseCookies } from './cookies.js';
import { FIXED_LEADER_ID, getAuthUser, hasRole, runWithUser } from './current-user.js';

// Só passa quem tem sessão válida. O usuário fica disponível, só para esta requisição, em getCurrentUser().
export const requireAuth =
  (sessions: Pick<SessionService, 'resolve'>): RequestHandler =>
  (req, res, next) => {
    const cookie = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    sessions
      .resolve(cookie)
      .then((user) => {
        if (!user) {
          next(new UnauthorizedError());
          return;
        }
        res.setHeader('Cache-Control', 'no-store');
        runWithUser(user, () => {
          next();
        });
      })
      .catch(next);
  };

// SÓ PARA TESTE LOCAL (LOCAL_AUTH_BYPASS=true, recusado em produção): pula o login e entra como a líder fixa.
export const localBypassAuth = (): RequestHandler => (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  runWithUser(
    {
      sessionId: 'local-bypass',
      subject: 'local-bypass',
      email: null,
      name: 'Teste local',
      roles: ['lider'],
      leaderId: FIXED_LEADER_ID,
    },
    () => {
      next();
    },
  );
};

// Exige um dos papéis. Usar depois de requireAuth.
export const requireRole =
  (...roles: string[]): RequestHandler =>
  (_req, _res, next) => {
    const user = getAuthUser();
    next(roles.some((role) => hasRole(user, role)) ? undefined : new ForbiddenError());
  };

export const LEADER_ROLE = 'lider';

// Nega por padrão: toda rota da API exige o papel `lider`, a menos que o caminho esteja na lista de exceções
// (futuras rotas do liderado e do administrador). Uma rota nova esquecida fica fechada, não aberta.
export const leaderOnlyByDefault =
  (allowedPrefixes: readonly string[] = []): RequestHandler =>
  (req, _res, next) => {
    const user = getAuthUser();
    const exempt = allowedPrefixes.some(
      (prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`),
    );
    next(exempt || hasRole(user, LEADER_ROLE) ? undefined : new ForbiddenError());
  };
