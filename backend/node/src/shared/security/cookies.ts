import type { CookieOptions, Response } from 'express';
import { env } from '../../config/env.js';

const isProduction = env.NODE_ENV === 'production';

// Em produção o prefixo __Host- obriga Secure, Path=/ e proíbe Domain (o navegador confere).
export const SESSION_COOKIE = isProduction ? '__Host-bonsai_sid' : 'bonsai_sid';
export const LOGIN_COOKIE = 'bonsai_oidc';
export const LOGIN_COOKIE_PATH = '/api/v1/auth';

export const parseCookies = (header: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const rawPart of header.split(';')) {
    const part = rawPart.trim();
    const index = part.indexOf('=');
    if (index < 1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!(name in cookies)) cookies[name] = value;
  }
  return cookies;
};

const baseOptions = (path: string): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path,
});

export const setSessionCookie = (res: Response, value: string, maxAgeMs: number) => {
  res.cookie(SESSION_COOKIE, value, { ...baseOptions('/'), maxAge: maxAgeMs });
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, baseOptions('/'));
};

export const setLoginCookie = (res: Response, value: string, maxAgeMs: number) => {
  res.cookie(LOGIN_COOKIE, value, { ...baseOptions(LOGIN_COOKIE_PATH), maxAge: maxAgeMs });
};

export const clearLoginCookie = (res: Response) => {
  res.clearCookie(LOGIN_COOKIE, baseOptions(LOGIN_COOKIE_PATH));
};
