import { createRemoteJWKSet, decodeJwt, jwtVerify, type JWTPayload } from 'jose';
import * as client from 'openid-client';
import { AppError } from '../../shared/errors/app-error.js';
import type { OidcProvider, TokenSet } from './oidc-provider.js';

type KeycloakConfig = {
  issuer: string;
  clientId: string;
  clientSecret: string;
};

const BACKCHANNEL_EVENT = 'http://schemas.openid.net/event/backchannel-logout';

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const rolesOf = (claims: JWTPayload): string[] => {
  const realm = (claims as { realm_access?: { roles?: unknown } }).realm_access;
  return Array.isArray(realm?.roles)
    ? realm.roles.filter((r): r is string => typeof r === 'string')
    : [];
};

export const createKeycloakProvider = ({
  issuer,
  clientId,
  clientSecret,
}: KeycloakConfig): OidcProvider => {
  let discovered: Promise<client.Configuration> | undefined;
  let keys: ReturnType<typeof createRemoteJWKSet> | undefined;

  // Descobre os endereços do Keycloak na primeira vez; se falhar, tenta de novo na próxima.
  const getConfig = () => {
    discovered ??= client
      .discovery(new URL(issuer), clientId, clientSecret)
      .catch((error: unknown) => {
        discovered = undefined;
        throw new AppError(
          'Não conseguimos entrar agora. Tente de novo em instantes.',
          503,
          'AUTH_UNAVAILABLE',
          [{ reason: error instanceof Error ? error.name : 'unknown' }],
        );
      });
    return discovered;
  };

  const getKeys = async () => {
    const config = await getConfig();
    const uri = config.serverMetadata().jwks_uri;
    if (!uri) throw new AppError('Keycloak sem chaves públicas.', 503, 'AUTH_UNAVAILABLE');
    keys ??= createRemoteJWKSet(new URL(uri));
    return keys;
  };

  const toTokenSet = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    previousRefreshToken?: string,
  ): Promise<TokenSet> => {
    const accessToken = tokens.access_token;
    const { payload } = await jwtVerify(accessToken, await getKeys(), { issuer });
    const claims = tokens.claims() ?? decodeJwt(accessToken);
    const refreshToken = tokens.refresh_token ?? previousRefreshToken;
    const subject = asText(claims.sub);
    if (!subject || !refreshToken) {
      throw new AppError('Resposta de login incompleta.', 502, 'AUTH_BAD_RESPONSE');
    }
    return {
      subject,
      email: asText((claims as { email?: unknown }).email),
      name:
        asText((claims as { name?: unknown }).name) ??
        asText((claims as { preferred_username?: unknown }).preferred_username),
      roles: rolesOf(payload),
      kcSid: asText((claims as { sid?: unknown }).sid) ?? asText(payload.sid),
      idToken: tokens.id_token ?? null,
      refreshToken,
    };
  };

  return {
    async buildLoginUrl({ redirectUri, state, nonce, codeChallenge, loginHint }) {
      const config = await getConfig();
      const url = client.buildAuthorizationUrl(config, {
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        response_type: 'code',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state,
        nonce,
        ...(loginHint ? { login_hint: loginHint } : {}),
      });
      return url.href;
    },

    async exchangeCode({ callbackUrl, state, nonce, codeVerifier }) {
      const config = await getConfig();
      const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedState: state,
        expectedNonce: nonce,
        idTokenExpected: true,
      });
      return toTokenSet(tokens);
    },

    async refresh(refreshToken) {
      const config = await getConfig();
      return toTokenSet(await client.refreshTokenGrant(config, refreshToken), refreshToken);
    },

    async buildLogoutUrl({ idToken, postLogoutRedirectUri }) {
      const config = await getConfig();
      return client.buildEndSessionUrl(config, {
        post_logout_redirect_uri: postLogoutRedirectUri,
        ...(idToken ? { id_token_hint: idToken } : {}),
      }).href;
    },

    async verifyLogoutToken(token) {
      const { payload } = await jwtVerify(token, await getKeys(), { issuer, audience: clientId });
      const events = (payload as { events?: Record<string, unknown> }).events;
      if (!events || !(BACKCHANNEL_EVENT in events) || 'nonce' in payload) {
        throw new AppError('Logout token inválido.', 400, 'INVALID_LOGOUT_TOKEN');
      }
      const sid = asText((payload as { sid?: unknown }).sid);
      const sub = asText(payload.sub);
      if (!sid && !sub) throw new AppError('Logout token inválido.', 400, 'INVALID_LOGOUT_TOKEN');
      return { sid, sub };
    },
  };
};
