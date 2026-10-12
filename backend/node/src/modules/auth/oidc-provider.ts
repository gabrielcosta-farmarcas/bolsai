// Contrato com o Keycloak. A implementação real fica em oidc-client.ts; nos testes entra uma falsa.
export type TokenSet = {
  subject: string;
  email: string | null;
  name: string | null;
  roles: string[];
  // Identificador da sessão no Keycloak (claim `sid`): usado para o logout em todos os lugares.
  kcSid: string | null;
  idToken: string | null;
  refreshToken: string;
};

export type OidcProvider = {
  buildLoginUrl(input: {
    redirectUri: string;
    state: string;
    nonce: string;
    codeChallenge: string;
    loginHint?: string;
  }): Promise<string>;
  // Troca o código recebido na volta do Keycloak por tokens, validando state, nonce, PKCE e assinatura.
  exchangeCode(input: {
    callbackUrl: URL;
    state: string;
    nonce: string;
    codeVerifier: string;
  }): Promise<TokenSet>;
  refresh(refreshToken: string): Promise<TokenSet>;
  buildLogoutUrl(input: { idToken: string | null; postLogoutRedirectUri: string }): Promise<string>;
  verifyLogoutToken(token: string): Promise<{ sid: string | null; sub: string | null }>;
};
