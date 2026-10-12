import express, { Router } from 'express';
import { csrfProtection } from '../../shared/security/csrf.js';
import { requireAuth } from '../../shared/security/require-auth.js';
import { env } from '../../config/env.js';
import { makeAuthController } from './auth.controller.js';
import type { OidcProvider } from './oidc-provider.js';
import type { SessionService } from './session.service.js';

type Deps = { sessions: SessionService; oidc: OidcProvider; key: Buffer };

export const authRouter = (deps: Deps) => {
  const controller = makeAuthController(deps);
  const router = Router();
  const appOrigin = new URL(env.APP_BASE_URL).origin;

  // Abertas: começam e terminam o login.
  router.get('/login', controller.login);
  router.get('/callback', controller.callback);
  // Chamada do próprio Keycloak (servidor a servidor, sem cookie); validada pela assinatura do token.
  router.post(
    '/backchannel-logout',
    express.urlencoded({ extended: false, limit: '10kb' }),
    controller.backchannelLogout,
  );

  router.get('/me', requireAuth(deps.sessions), controller.me);
  router.post('/logout', csrfProtection(appOrigin), controller.logout);

  return router;
};
