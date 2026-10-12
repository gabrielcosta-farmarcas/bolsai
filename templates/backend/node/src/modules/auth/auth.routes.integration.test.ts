import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { env } from '../../config/env.js';
import { prisma } from '../../shared/database/prisma.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';
import { hashSessionToken } from '../../shared/security/session-crypto.js';
import { TEST_ORIGIN, createTestSession } from '../../test/auth.js';
import { newPersonBody } from '../../test/responsibilities.js';
import { makeFakeOidc, sampleTokens } from '../../test/fake-oidc.js';
import { resetDatabase } from '../../test/reset-database.js';

const AUTH = '/api/v1/auth';

type SetCookie = string[] | undefined;
const cookieNamed = (setCookie: SetCookie, name: string) =>
  (setCookie ?? []).find((cookie) => cookie.startsWith(`${name}=`));
const valueOf = (cookie: string | undefined) =>
  cookie?.split(';')[0]?.split('=').slice(1).join('=') ?? '';

const writeHeaders = (cookie?: string) => ({
  ...(cookie ? { Cookie: cookie } : {}),
  'X-Requested-With': 'bonsai',
  Origin: TEST_ORIGIN,
});

describe('auth', () => {
  let fake: ReturnType<typeof makeFakeOidc>;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    await resetDatabase();
    fake = makeFakeOidc();
    app = createApp({ oidc: fake.provider });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Faz o caminho completo do login com o Keycloak de mentira e devolve o cookie de sessão.
  const signIn = async (returnTo = '/pessoas') => {
    const start = await request(app).get(`${AUTH}/login`).query({ returnTo });
    const loginCookie = `bonsai_oidc=${valueOf(cookieNamed(start.headers['set-cookie'] as SetCookie, 'bonsai_oidc'))}`;
    const state = new URL(start.headers.location as string).searchParams.get('state');
    const callback = await request(app)
      .get(`${AUTH}/callback`)
      .query({ code: 'codigo-qualquer', state })
      .set('Cookie', loginCookie);
    return { start, callback };
  };

  describe('entrada', () => {
    it('deve mandar ao Keycloak com PKCE, state e dica de e-mail, e guardar o segredo em cookie protegido', async () => {
      const response = await request(app)
        .get(`${AUTH}/login`)
        .query({ hint: 'ana@empresa.com.br' });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('keycloak.test');
      expect(fake.control.lastLoginRequest).toMatchObject({
        redirectUri: `${env.APP_BASE_URL}/api/v1/auth/callback`,
        loginHint: 'ana@empresa.com.br',
      });
      expect(fake.control.lastLoginRequest?.codeChallenge.length).toBeGreaterThanOrEqual(43);
      const cookie = cookieNamed(response.headers['set-cookie'] as SetCookie, 'bonsai_oidc') ?? '';
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).not.toContain(fake.control.lastLoginRequest?.state ?? 'x');
      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('deve concluir o login, criar a sessão e voltar à tela pedida', async () => {
      const { callback } = await signIn('/pessoas?aba=combinados');

      expect(callback.status).toBe(303);
      expect(callback.headers.location).toBe('/pessoas?aba=combinados');
      const session = cookieNamed(callback.headers['set-cookie'] as SetCookie, 'bonsai_sid') ?? '';
      expect(session).toContain('HttpOnly');
      expect(session).toContain('SameSite=Lax');
      expect(session).toContain('Path=/');
      expect(fake.control.lastExchange?.codeVerifier.length).toBeGreaterThanOrEqual(43);
      const stored = await prisma.authSession.findUnique({
        where: { id: hashSessionToken(valueOf(session)) },
      });
      expect(stored?.tokensEnc).not.toContain('refresh-token-1');
    });

    it('deve ignorar returnTo de outro site', async () => {
      const { callback } = await signIn('https://mal.example');

      expect(callback.headers.location).toBe('/');
    });

    it('deve recusar state diferente, cookie ausente ou adulterado', async () => {
      const start = await request(app).get(`${AUTH}/login`);
      const loginCookie = `bonsai_oidc=${valueOf(cookieNamed(start.headers['set-cookie'] as SetCookie, 'bonsai_oidc'))}`;

      const wrongState = await request(app)
        .get(`${AUTH}/callback`)
        .query({ code: 'x', state: 'outro' })
        .set('Cookie', loginCookie);
      const noCookie = await request(app).get(`${AUTH}/callback`).query({ code: 'x', state: 'a' });
      const tampered = await request(app)
        .get(`${AUTH}/callback`)
        .query({ code: 'x', state: 'a' })
        .set('Cookie', `${loginCookie}A`);

      for (const response of [wrongState, noCookie, tampered]) {
        expect(response.status).toBe(303);
        expect(response.headers.location).toMatch(/^\/login\?erro=/);
        expect(
          cookieNamed(response.headers['set-cookie'] as SetCookie, 'bonsai_sid'),
        ).toBeUndefined();
      }
    });

    it('deve voltar ao login quando o Keycloak recusa o código', async () => {
      fake.control.exchangeFails = true;

      const { callback } = await signIn();

      expect(callback.headers.location).toBe('/login?erro=falha');
      expect(
        cookieNamed(callback.headers['set-cookie'] as SetCookie, 'bonsai_sid'),
      ).toBeUndefined();
    });

    it('deve voltar ao login quando a pessoa cancela no Keycloak', async () => {
      const start = await request(app).get(`${AUTH}/login`);
      const loginCookie = `bonsai_oidc=${valueOf(cookieNamed(start.headers['set-cookie'] as SetCookie, 'bonsai_oidc'))}`;
      const state = new URL(start.headers.location as string).searchParams.get('state');

      const response = await request(app)
        .get(`${AUTH}/callback`)
        .query({ error: 'access_denied', state })
        .set('Cookie', loginCookie);

      expect(response.headers.location).toBe('/login?erro=cancelado');
    });

    it('deve voltar ao login com aviso quando o Keycloak está indisponível ou sem configuração', async () => {
      const unavailable = createApp({
        oidc: { ...fake.provider, buildLoginUrl: () => Promise.reject(new Error('fora do ar')) },
      });

      const response = await request(unavailable).get(`${AUTH}/login`);

      expect(response.status).toBe(303);
      expect(response.headers.location).toBe('/login?erro=indisponivel');
      expect(
        cookieNamed(response.headers['set-cookie'] as SetCookie, 'bonsai_oidc'),
      ).toBeUndefined();
    });
  });

  describe('líder do Keycloak', () => {
    it('deve adotar a líder do MVP 1 na primeira entrada e criar outra para a segunda pessoa', async () => {
      const first = await signIn();
      const firstSession = valueOf(
        cookieNamed(first.callback.headers['set-cookie'] as SetCookie, 'bonsai_sid'),
      );
      fake.control.tokens = sampleTokens({ subject: 'user-2', name: 'Bia', kcSid: 'kc-2' });
      const second = await signIn();
      const secondSession = valueOf(
        cookieNamed(second.callback.headers['set-cookie'] as SetCookie, 'bonsai_sid'),
      );

      const rows = await prisma.authSession.findMany({
        where: { id: { in: [hashSessionToken(firstSession), hashSessionToken(secondSession)] } },
      });
      const byId = Object.fromEntries(rows.map((row) => [row.id, row.leaderId]));
      expect(byId[hashSessionToken(firstSession)]).toBe(FIXED_LEADER_ID);
      expect(byId[hashSessionToken(secondSession)]).not.toBe(FIXED_LEADER_ID);
      expect(byId[hashSessionToken(secondSession)]).toBeTruthy();
    });

    it('deve manter a mesma líder quando a pessoa entra de novo', async () => {
      await signIn();
      await signIn();

      expect(await prisma.leader.count({ where: { keycloakSubject: 'user-1' } })).toBe(1);
    });
  });

  describe('sessão', () => {
    it('deve dizer quem está logado em /auth/me e recusar quem não entrou', async () => {
      const cookie = await createTestSession({
        roles: ['lider', 'administrador'],
        name: 'Ana Souza',
      });

      const ok = await request(app).get(`${AUTH}/me`).set('Cookie', `bonsai_sid=${cookie}`);
      const anonymous = await request(app).get(`${AUTH}/me`);

      expect(ok.status).toBe(200);
      expect(ok.body.user).toMatchObject({ name: 'Ana Souza', roles: ['lider', 'administrador'] });
      expect(ok.headers['cache-control']).toBe('no-store');
      expect(anonymous.status).toBe(401);
      expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('deve sair: apagar a sessão, limpar o cookie e devolver o endereço de logout do Keycloak', async () => {
      const cookie = await createTestSession();

      const response = await request(app)
        .post(`${AUTH}/logout`)
        .set(writeHeaders(`bonsai_sid=${cookie}`));

      expect(response.status).toBe(200);
      expect(response.body.logoutUrl).toContain('keycloak.test');
      expect(response.body.logoutUrl).toContain('id_token_hint=id-token');
      expect(cookieNamed(response.headers['set-cookie'] as SetCookie, 'bonsai_sid')).toContain(
        'Expires=',
      );
      const after = await request(app).get(`${AUTH}/me`).set('Cookie', `bonsai_sid=${cookie}`);
      expect(after.status).toBe(401);
    });

    it('deve recusar sair sem o cabeçalho de proteção (CSRF)', async () => {
      const cookie = await createTestSession();

      const response = await request(app)
        .post(`${AUTH}/logout`)
        .set('Cookie', `bonsai_sid=${cookie}`);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('CSRF_REJECTED');
      expect(
        (await request(app).get(`${AUTH}/me`).set('Cookie', `bonsai_sid=${cookie}`)).status,
      ).toBe(200);
    });

    it('deve derrubar a sessão quando o Keycloak avisa (back-channel logout)', async () => {
      const cookie = await createTestSession({ kcSid: 'kc-sid-1' });
      fake.control.logoutClaims = { sid: 'kc-sid-1', sub: null };

      const response = await request(app)
        .post(`${AUTH}/backchannel-logout`)
        .type('form')
        .send({ logout_token: 'jwt' });

      expect(response.status).toBe(200);
      expect(
        (await request(app).get(`${AUTH}/me`).set('Cookie', `bonsai_sid=${cookie}`)).status,
      ).toBe(401);
    });

    it('deve recusar back-channel logout com token inválido ou ausente', async () => {
      const cookie = await createTestSession();
      fake.control.logoutTokenValid = false;

      const invalid = await request(app)
        .post(`${AUTH}/backchannel-logout`)
        .type('form')
        .send({ logout_token: 'jwt' });
      const missing = await request(app).post(`${AUTH}/backchannel-logout`).type('form').send({});

      expect(invalid.status).toBe(400);
      expect(missing.status).toBe(400);
      expect(
        (await request(app).get(`${AUTH}/me`).set('Cookie', `bonsai_sid=${cookie}`)).status,
      ).toBe(200);
    });
  });

  describe('API trancada', () => {
    const routes: Array<['get' | 'post' | 'patch' | 'put' | 'delete', string]> = [
      ['get', '/api/v1/direct-reports'],
      ['post', '/api/v1/direct-reports'],
      ['get', `/api/v1/direct-reports/${FIXED_LEADER_ID}`],
      ['delete', `/api/v1/direct-reports/${FIXED_LEADER_ID}`],
      ['get', `/api/v1/direct-reports/${FIXED_LEADER_ID}/sessions`],
      ['get', `/api/v1/direct-reports/${FIXED_LEADER_ID}/timeline`],
      ['get', `/api/v1/direct-reports/${FIXED_LEADER_ID}/agreements`],
      ['get', `/api/v1/sessions/${FIXED_LEADER_ID}`],
      ['post', `/api/v1/sessions/${FIXED_LEADER_ID}/analyses`],
      ['get', `/api/v1/analyses/${FIXED_LEADER_ID}`],
      ['get', '/api/v1/agreements'],
      ['get', '/api/v1/qualquer-coisa'],
    ];

    it.each(routes)('deve responder 401 sem sessão em %s %s', async (method, url) => {
      const response = await request(app)[method](url).set(writeHeaders());

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('deve responder 401 com cookie falso, vazio ou de sessão apagada', async () => {
      const gone = await createTestSession();
      await prisma.authSession.deleteMany();

      for (const cookie of ['bonsai_sid=', 'bonsai_sid=falso', `bonsai_sid=${gone}`]) {
        const response = await request(app).get('/api/v1/direct-reports').set('Cookie', cookie);
        expect(response.status).toBe(401);
      }
    });

    it('deve recusar escrita sem o cabeçalho do Bonsai ou de outra origem, mesmo com sessão', async () => {
      const cookie = await createTestSession();
      const base = () =>
        request(app).post('/api/v1/direct-reports').set('Cookie', `bonsai_sid=${cookie}`);
      const body = newPersonBody({ name: 'Ana' });

      const noHeader = await base().set('Origin', TEST_ORIGIN).send(body);
      const otherOrigin = await base()
        .set({ 'X-Requested-With': 'bonsai', Origin: 'https://mal.example' })
        .send(body);
      const ok = await base()
        .set(writeHeaders(`bonsai_sid=${cookie}`))
        .send(body);

      expect(noHeader.status).toBe(403);
      expect(otherOrigin.status).toBe(403);
      expect(ok.status).toBe(201);
    });

    it('deve responder 403 para quem entrou sem o papel de líder', async () => {
      const cookie = await createTestSession({
        roles: ['administrador'],
        leaderId: null,
        subject: 'admin',
      });

      const response = await request(app)
        .get('/api/v1/direct-reports')
        .set('Cookie', `bonsai_sid=${cookie}`);

      expect(response.status).toBe(403);
    });

    it('deve manter /health aberto e enviar cabeçalhos de segurança', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
