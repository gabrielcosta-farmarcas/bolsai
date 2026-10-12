import type { RequestHandler } from 'express';
import { ForbiddenError } from '../errors/forbidden-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'bonsai';

// Defesa contra pedidos forjados por outro site: toda escrita precisa do cabeçalho do Bonsai e
// vir da origem da tela. Outro site não consegue enviar esse cabeçalho sem permissão (sem CORS).
export const csrfProtection =
  (appOrigin: string): RequestHandler =>
  (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }
    const headerOk = req.get(CSRF_HEADER) === CSRF_VALUE;
    const originOk = req.get('origin') === appOrigin;
    if (headerOk && originOk) {
      next();
      return;
    }
    next(new ForbiddenError('Pedido recusado.', 'CSRF_REJECTED'));
  };
