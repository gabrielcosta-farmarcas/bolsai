import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/logger.js';
import {
  LOGIN_COOKIE,
  SESSION_COOKIE,
  clearLoginCookie,
  clearSessionCookie,
  parseCookies,
  setLoginCookie,
  setSessionCookie,
} from '../../shared/security/cookies.js';
import { getAuthUser } from '../../shared/security/current-user.js';
import { decrypt, encrypt } from '../../shared/security/session-crypto.js';
import { newLoginSecrets, safeReturnTo } from './login-flow.js';
import type { OidcProvider } from './oidc-provider.js';
import type { SessionService } from './session.service.js';

const LOGIN_COOKIE_TTL_MS = 10 * 60 * 1000;
const CALLBACK_PATH = '/api/v1/auth/callback';

const loginQuerySchema = z.object({
  returnTo: z.string().optional(),
  hint: z.string().trim().max(254).optional(),
});

const loginCookieSchema = z.object({
  state: z.string(),
  nonce: z.string(),
  verifier: z.string(),
  returnTo: z.string(),
});

type Deps = { sessions: SessionService; oidc: OidcProvider; key: Buffer };

const failToLogin = (res: Response, reason: string) => {
  res.redirect(303, `/login?erro=${reason}`);
};

export const makeAuthController = ({ sessions, oidc, key }: Deps) => {
  const redirectUri = `${env.APP_BASE_URL}${CALLBACK_PATH}`;

  const login: RequestHandler = async (req, res) => {
    const query = loginQuerySchema.parse(req.query);
    const secrets = newLoginSecrets();
    let url: string;
    try {
      url = await oidc.buildLoginUrl({
        redirectUri,
        state: secrets.state,
        nonce: secrets.nonce,
        codeChallenge: secrets.challenge,
        loginHint: query.hint || undefined,
      });
    } catch (error) {
      // Keycloak fora do ar ou sem configuração: volta ao login com um aviso simples.
      logger.warn(
        { reason: error instanceof Error ? error.name : 'unknown' },
        'login start failed',
      );
      failToLogin(res, 'indisponivel');
      return;
    }
    const cookie = encrypt(
      JSON.stringify({
        state: secrets.state,
        nonce: secrets.nonce,
        verifier: secrets.verifier,
        returnTo: safeReturnTo(query.returnTo),
      }),
      key,
    );
    setLoginCookie(res, cookie, LOGIN_COOKIE_TTL_MS);
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, url);
  };

  const callback: RequestHandler = async (req, res) => {
    const sealed = parseCookies(req.headers.cookie)[LOGIN_COOKIE];
    clearLoginCookie(res);
    res.setHeader('Cache-Control', 'no-store');

    const text = sealed ? decrypt(sealed, key) : null;
    const parsed = text ? loginCookieSchema.safeParse(JSON.parse(text)) : null;
    if (
      !parsed?.success ||
      typeof req.query.state !== 'string' ||
      req.query.state !== parsed.data.state
    ) {
      failToLogin(res, 'sessao');
      return;
    }
    if (typeof req.query.error === 'string') {
      failToLogin(res, 'cancelado');
      return;
    }

    try {
      const tokens = await oidc.exchangeCode({
        callbackUrl: new URL(`${env.APP_BASE_URL}${req.originalUrl}`),
        state: parsed.data.state,
        nonce: parsed.data.nonce,
        codeVerifier: parsed.data.verifier,
      });
      const session = await sessions.create(tokens);
      setSessionCookie(res, session.cookieValue, session.maxAgeMs);
      res.redirect(303, parsed.data.returnTo);
    } catch (error) {
      // Nada do que veio na URL (código, state) vai para o log.
      logger.warn(
        { reason: error instanceof Error ? error.name : 'unknown' },
        'login callback failed',
      );
      failToLogin(res, 'falha');
    }
  };

  const me: RequestHandler = (_req, res) => {
    const user = getAuthUser();
    res.json({ user: { name: user.name, email: user.email, roles: user.roles } });
  };

  const logout: RequestHandler = async (req, res) => {
    const cookie = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    let logoutUrl = `${env.APP_BASE_URL}/login`;
    if (cookie) {
      const idToken = await sessions.idTokenOf(cookie);
      await sessions.destroy(cookie);
      try {
        logoutUrl = await oidc.buildLogoutUrl({
          idToken,
          postLogoutRedirectUri: `${env.APP_BASE_URL}/login`,
        });
      } catch {
        // Keycloak indisponível: a sessão do Bonsai já foi encerrada; só não avisamos o Keycloak.
      }
    }
    clearSessionCookie(res);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ logoutUrl });
  };

  const backchannelLogout = async (req: Request, res: Response) => {
    const token = (req.body as { logout_token?: unknown } | undefined)?.logout_token;
    if (typeof token !== 'string') {
      throw new AppError('Logout token ausente.', 400, 'INVALID_LOGOUT_TOKEN');
    }
    let claims;
    try {
      claims = await oidc.verifyLogoutToken(token);
    } catch {
      throw new AppError('Logout token inválido.', 400, 'INVALID_LOGOUT_TOKEN');
    }
    await sessions.destroyFromKeycloak(claims);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send();
  };

  return { login, callback, me, logout, backchannelLogout };
};
