import pino, { type LoggerOptions } from 'pino';
import { env } from '../config/env.js';

// Conteúdo de 1:1 nunca vai para o log: só IDs, tamanhos, tempos, modelo e tokens.
export const SENSITIVE_LOG_FIELDS = [
  'transcript',
  'text',
  'rawJson',
  'reviewedJson',
  'content',
  'analysis',
  'summary',
  'privateLeaderNotes',
  'private_leader_notes',
  // Credenciais de login: nunca no log.
  'authorization',
  'cookie',
  'password',
  'state',
  'nonce',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'access_token',
  'refresh_token',
  'id_token',
  'logout_token',
  'client_secret',
  // Configurações de IA: a chave de API e o prompt da líder.
  'apiKey',
  'api_key',
  'analysisPrompt',
  'x-api-key',
];

const redactPaths = [
  ...SENSITIVE_LOG_FIELDS.flatMap((field) => [field, `*.${field}`, `*.*.${field}`]),
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  '*.headers["set-cookie"]',
];

export const loggerOptions: LoggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : env.NODE_ENV === 'test' ? 'silent' : 'debug',
  redact: { paths: redactPaths, censor: '[removido]' },
};

export const logger = pino(loggerOptions);
