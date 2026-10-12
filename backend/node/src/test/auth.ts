import type { Express } from 'express';
import request from 'supertest';
import { env } from '../config/env.js';
import { sessionRepository } from '../modules/auth/session.repository.js';
import { SESSION_MAX_MS } from '../modules/auth/session.service.js';
import { SESSION_COOKIE } from '../shared/security/cookies.js';
import { FIXED_LEADER_ID } from '../shared/security/current-user.js';
import {
  encrypt,
  hashSessionToken,
  loadKey,
  newSessionToken,
} from '../shared/security/session-crypto.js';

export const TEST_ORIGIN = new URL(env.APP_BASE_URL).origin;

type TestSessionOptions = {
  subject?: string;
  roles?: string[];
  leaderId?: string | null;
  kcSid?: string;
  name?: string;
};

// Cria uma sessão de verdade no banco de teste e devolve o valor do cookie.
export const createTestSession = async ({
  subject = 'test-leader',
  roles = ['lider'],
  leaderId = FIXED_LEADER_ID,
  kcSid = `kc-${subject}`,
  name = 'Ana Souza',
}: TestSessionOptions = {}) => {
  const cookieValue = newSessionToken();
  const key = loadKey(env.SESSION_ENCRYPTION_KEY ?? '');
  const now = new Date();
  await sessionRepository.create({
    id: hashSessionToken(cookieValue),
    subject,
    leaderId,
    kcSid,
    roles,
    email: `${subject}@empresa.com.br`,
    name,
    tokensEnc: encrypt(JSON.stringify({ idToken: 'id-token', refreshToken: 'refresh-token' }), key),
    lastUsedAt: now,
    refreshedAt: now,
    expiresAt: new Date(now.getTime() + SESSION_MAX_MS),
  });
  return cookieValue;
};

let defaultCookie = '';
export const setDefaultTestSession = (cookieValue: string) => {
  defaultCookie = cookieValue;
};

// Como `request(app)`, mas entrando com a sessão de teste (cookie + cabeçalhos exigidos pela API).
export const authed = (app: Express, cookieValue?: string) => {
  const headers = () => ({
    Cookie: `${SESSION_COOKIE}=${cookieValue ?? defaultCookie}`,
    'X-Requested-With': 'bonsai',
    Origin: TEST_ORIGIN,
  });
  const make = (method: 'get' | 'post' | 'put' | 'patch' | 'delete') => (url: string) =>
    request(app)[method](url).set(headers());
  return {
    get: make('get'),
    post: make('post'),
    put: make('put'),
    patch: make('patch'),
    delete: make('delete'),
  };
};
