import type { OidcProvider, TokenSet } from '../modules/auth/oidc-provider.js';

export const sampleTokens = (overrides: Partial<TokenSet> = {}): TokenSet => ({
  subject: 'user-1',
  email: 'ana@empresa.com.br',
  name: 'Ana Souza',
  roles: ['lider'],
  kcSid: 'kc-sid-1',
  idToken: 'id-token-1',
  refreshToken: 'refresh-token-1',
  ...overrides,
});

// Keycloak de mentira para os testes: o que ele devolve é decidido por quem escreve o teste.
export const makeFakeOidc = () => {
  const control = {
    tokens: sampleTokens(),
    refreshResult: null as TokenSet | null,
    refreshFails: false,
    exchangeFails: false,
    logoutClaims: { sid: 'kc-sid-1' as string | null, sub: null as string | null },
    logoutTokenValid: true,
    lastLoginRequest: null as Parameters<OidcProvider['buildLoginUrl']>[0] | null,
    lastExchange: null as Parameters<OidcProvider['exchangeCode']>[0] | null,
    refreshCalls: 0,
  };

  const provider: OidcProvider = {
    buildLoginUrl(input) {
      control.lastLoginRequest = input;
      const url = new URL('https://keycloak.test/realms/bonsai/protocol/openid-connect/auth');
      url.searchParams.set('state', input.state);
      url.searchParams.set('code_challenge', input.codeChallenge);
      if (input.loginHint) url.searchParams.set('login_hint', input.loginHint);
      return Promise.resolve(url.href);
    },
    exchangeCode(input) {
      control.lastExchange = input;
      return control.exchangeFails
        ? Promise.reject(new Error('código inválido'))
        : Promise.resolve(control.tokens);
    },
    refresh() {
      control.refreshCalls += 1;
      if (control.refreshFails) return Promise.reject(new Error('invalid_grant'));
      return Promise.resolve(control.refreshResult ?? control.tokens);
    },
    buildLogoutUrl({ idToken, postLogoutRedirectUri }) {
      const url = new URL('https://keycloak.test/realms/bonsai/protocol/openid-connect/logout');
      if (idToken) url.searchParams.set('id_token_hint', idToken);
      url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
      return Promise.resolve(url.href);
    },
    verifyLogoutToken() {
      return control.logoutTokenValid
        ? Promise.resolve(control.logoutClaims)
        : Promise.reject(new Error('assinatura inválida'));
    },
  };

  return { provider, control };
};
