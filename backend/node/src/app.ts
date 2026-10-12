import express from 'express';
import { pinoHttp } from 'pino-http';
import { prisma } from './shared/database/prisma.js';
import { logger } from './shared/logger.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { requestId } from './shared/middlewares/request-id.js';
import { directReportsRouter } from './modules/direct-reports/direct-reports.routes.js';
import type { AnalysesService } from './modules/analyses/analyses.service.js';
import { agreementsRouter } from './modules/agreements/agreements.routes.js';
import { analysesRouter } from './modules/analyses/analyses.routes.js';
import { exportsRouter } from './modules/exports/exports.routes.js';
import { sessionsRouter } from './modules/sessions/sessions.routes.js';
import { timelineRouter } from './modules/timeline/timeline.routes.js';
import { responsibilityMapsRouter } from './modules/responsibility-maps/responsibility-maps.routes.js';
import { responsibilitiesRouter } from './modules/responsibilities/responsibilities.routes.js';
import { makeTitleSuggester, type TitleSuggester } from './modules/responsibilities/titles.js';
import { responsibilitiesRepository } from './modules/responsibilities/responsibilities.repository.js';
import { getAiClientFor } from './modules/settings/settings.instance.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import type { SettingsService } from './modules/settings/settings.service.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { leaderLinkRepository } from './modules/auth/leader-link.repository.js';
import { createKeycloakProvider } from './modules/auth/oidc-client.js';
import type { OidcProvider } from './modules/auth/oidc-provider.js';
import { sessionRepository } from './modules/auth/session.repository.js';
import { makeSessionService, type SessionService } from './modules/auth/session.service.js';
import { env } from './config/env.js';
import { AppError } from './shared/errors/app-error.js';
import { csrfProtection } from './shared/security/csrf.js';
import { API_LIMIT, AUTH_LIMIT, createRateLimiter } from './shared/security/rate-limit.js';
import { leaderOnlyByDefault, requireAuth } from './shared/security/require-auth.js';
import { securityHeaders } from './shared/security/security-headers.js';
import { loadKey } from './shared/security/session-crypto.js';

type AppDeps = {
  analysesService?: AnalysesService;
  settingsService?: SettingsService;
  // Trocável nos testes (para não chamar a IA de verdade nem esperar segundo plano).
  titles?: TitleSuggester;
  // Trocáveis nos testes; em uso normal vêm do Keycloak configurado no .env.
  oidc?: OidcProvider;
  sessions?: SessionService;
};

// Sem configuração de login a API sobe (e /health responde), mas toda tentativa de entrar avisa.
const notConfiguredProvider = (): OidcProvider => {
  const fail = (): never => {
    throw new AppError(
      'O login ainda não foi configurado neste ambiente.',
      503,
      'AUTH_NOT_CONFIGURED',
    );
  };
  return {
    buildLoginUrl: () => Promise.resolve(fail()),
    exchangeCode: () => Promise.resolve(fail()),
    refresh: () => Promise.resolve(fail()),
    buildLogoutUrl: () => Promise.resolve(fail()),
    verifyLogoutToken: () => Promise.resolve(fail()),
  };
};

const defaultOidc = (): OidcProvider =>
  env.KEYCLOAK_ISSUER && env.KEYCLOAK_CLIENT_SECRET && env.SESSION_ENCRYPTION_KEY
    ? createKeycloakProvider({
        issuer: env.KEYCLOAK_ISSUER,
        clientId: env.KEYCLOAK_CLIENT_ID,
        clientSecret: env.KEYCLOAK_CLIENT_SECRET,
      })
    : notConfiguredProvider();

export const createApp = (deps: AppDeps = {}) => {
  const app = express();
  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);
  app.use(securityHeaders());
  app.use(express.json());
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id,
      // Só id, método e caminho: sem cabeçalhos (cookie) e sem query (código e state do login).
      serializers: {
        req: (req: { id: unknown; method: string; url: string }) => ({
          id: req.id,
          method: req.method,
          url: req.url.split('?')[0],
        }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  const key = loadKey(env.SESSION_ENCRYPTION_KEY ?? Buffer.alloc(32).toString('base64'));
  const oidc = deps.oidc ?? defaultOidc();
  const sessions =
    deps.sessions ??
    makeSessionService({ repository: sessionRepository, oidc, leaders: leaderLinkRepository, key });
  const appOrigin = new URL(env.APP_BASE_URL).origin;

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/health/ready', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok' });
    } catch (error) {
      logger.warn({ err: error }, 'readiness check failed');
      res.status(503).json({
        error: { code: 'NOT_READY', message: 'Banco indisponível', details: [] },
      });
    }
  });

  // A partir daqui tudo é /api: limite de pedidos; entrada com limite mais apertado.
  app.use('/api', createRateLimiter(API_LIMIT));
  app.use('/api/v1/auth', createRateLimiter(AUTH_LIMIT), authRouter({ sessions, oidc, key }));

  // Todo o resto exige pedido legítimo da tela (CSRF) e sessão válida.
  // Sem o papel `lider`, nada de conteúdo (nega por padrão: rota nova também fica fechada).
  app.use('/api/v1', csrfProtection(appOrigin), requireAuth(sessions), leaderOnlyByDefault());

  const titles =
    deps.titles ??
    makeTitleSuggester({ repo: responsibilitiesRepository, getAiClient: getAiClientFor });

  app.use('/api/v1/direct-reports', directReportsRouter(titles));
  app.use('/api/v1', responsibilityMapsRouter(titles));
  app.use('/api/v1', responsibilitiesRouter());
  app.use('/api/v1', sessionsRouter());
  app.use('/api/v1', analysesRouter(deps.analysesService));
  app.use('/api/v1', agreementsRouter());
  app.use('/api/v1', timelineRouter());
  app.use('/api/v1', exportsRouter());
  app.use('/api/v1', settingsRouter(deps.settingsService));

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Rota não encontrada', details: [] },
    });
  });

  app.use(errorHandler);
  return app;
};

export const app = createApp();
