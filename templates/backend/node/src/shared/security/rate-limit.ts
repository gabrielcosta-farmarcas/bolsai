import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppError } from '../errors/app-error.js';

type LimitOptions = { windowMs: number; limit: number };

export const createRateLimiter = ({ windowMs, limit }: LimitOptions): RequestHandler =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new AppError('Muitas tentativas. Aguarde um pouco e tente de novo.', 429, 'RATE_LIMITED'),
      );
    },
  });

// Entrada: poucas tentativas por janela (o Keycloak ainda bloqueia a conta após 5 erros).
export const AUTH_LIMIT: LimitOptions = { windowMs: 10 * 60 * 1000, limit: 60 };
// API em geral: folgado para uso normal, apertado para varredura.
export const API_LIMIT: LimitOptions = { windowMs: 60 * 1000, limit: 600 };
