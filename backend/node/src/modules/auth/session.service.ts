import type { AuthUser } from '../../shared/security/current-user.js';
import {
  decrypt,
  encrypt,
  hashSessionToken,
  newSessionToken,
} from '../../shared/security/session-crypto.js';
import type { LeaderLinkRepository } from './leader-link.repository.js';
import type { OidcProvider, TokenSet } from './oidc-provider.js';
import type { SessionRepository, SessionRow } from './session.repository.js';

export const LEADER_ROLE = 'lider';
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_MAX_MS = 10 * 60 * 60 * 1000;
export const SESSION_REFRESH_MS = 5 * 60 * 1000;

type Deps = {
  repository: SessionRepository;
  oidc: OidcProvider;
  leaders: LeaderLinkRepository;
  key: Buffer;
  now?: () => Date;
};

type StoredTokens = { idToken: string | null; refreshToken: string };

export const makeSessionService = ({
  repository,
  oidc,
  leaders,
  key,
  now = () => new Date(),
}: Deps) => {
  const seal = (tokens: StoredTokens) => encrypt(JSON.stringify(tokens), key);

  const unseal = (row: SessionRow): StoredTokens | null => {
    const text = decrypt(row.tokensEnc, key);
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as StoredTokens;
      return typeof parsed.refreshToken === 'string' ? parsed : null;
    } catch {
      return null;
    }
  };

  const toUser = (
    row: Pick<SessionRow, 'id' | 'subject' | 'email' | 'name' | 'roles' | 'leaderId'>,
  ): AuthUser => ({
    sessionId: row.id,
    subject: row.subject,
    email: row.email,
    name: row.name,
    roles: row.roles,
    leaderId: row.leaderId,
  });

  const leaderFor = async (tokens: Pick<TokenSet, 'subject' | 'name' | 'roles'>) =>
    tokens.roles.includes(LEADER_ROLE) ? leaders.linkLeader(tokens.subject, tokens.name) : null;

  return {
    // Cria a sessão depois do login. O valor do cookie é novo a cada login (evita fixação de sessão).
    async create(tokens: TokenSet): Promise<{ cookieValue: string; maxAgeMs: number }> {
      const cookieValue = newSessionToken();
      const at = now();
      await repository.create({
        id: hashSessionToken(cookieValue),
        subject: tokens.subject,
        leaderId: await leaderFor(tokens),
        kcSid: tokens.kcSid,
        roles: tokens.roles,
        email: tokens.email,
        name: tokens.name,
        tokensEnc: seal({ idToken: tokens.idToken, refreshToken: tokens.refreshToken }),
        lastUsedAt: at,
        refreshedAt: at,
        expiresAt: new Date(at.getTime() + SESSION_MAX_MS),
      });
      return { cookieValue, maxAgeMs: SESSION_MAX_MS };
    },

    // Devolve o usuário se a sessão vale; senão apaga e devolve null.
    async resolve(cookieValue: string | undefined): Promise<AuthUser | null> {
      if (!cookieValue) return null;
      const id = hashSessionToken(cookieValue);
      const row = await repository.findById(id);
      if (!row) return null;

      const at = now();
      const idleFor = at.getTime() - row.lastUsedAt.getTime();
      if (row.expiresAt <= at || idleFor > SESSION_IDLE_MS) {
        await repository.deleteById(id);
        return null;
      }

      if (at.getTime() - row.refreshedAt.getTime() < SESSION_REFRESH_MS) {
        await repository.update(id, { lastUsedAt: at });
        return toUser(row);
      }

      // De tempos em tempos confere com o Keycloak: conta desativada ou sessão encerrada lá derruba esta.
      const stored = unseal(row);
      if (!stored) {
        await repository.deleteById(id);
        return null;
      }
      try {
        const fresh = await oidc.refresh(stored.refreshToken);
        if (fresh.subject !== row.subject) throw new Error('subject mudou');
        const leaderId = fresh.roles.includes(LEADER_ROLE)
          ? (row.leaderId ?? (await leaderFor(fresh)))
          : null;
        await repository.update(id, {
          roles: fresh.roles,
          leaderId,
          tokensEnc: seal({
            idToken: fresh.idToken ?? stored.idToken,
            refreshToken: fresh.refreshToken,
          }),
          lastUsedAt: at,
          refreshedAt: at,
        });
        return toUser({ ...row, roles: fresh.roles, leaderId });
      } catch {
        await repository.deleteById(id);
        return null;
      }
    },

    async idTokenOf(cookieValue: string): Promise<string | null> {
      const row = await repository.findById(hashSessionToken(cookieValue));
      return row ? (unseal(row)?.idToken ?? null) : null;
    },

    async destroy(cookieValue: string): Promise<void> {
      await repository.deleteById(hashSessionToken(cookieValue));
    },

    // Logout vindo do Keycloak (back-channel): derruba a sessão, ou todas da pessoa se só veio o `sub`.
    async destroyFromKeycloak({
      sid,
      sub,
    }: {
      sid: string | null;
      sub: string | null;
    }): Promise<number> {
      if (sid) return repository.deleteByKeycloakSession(sid);
      if (sub) return repository.deleteBySubject(sub);
      return 0;
    },

    cleanup: () => repository.deleteExpired(now()),
  };
};

export type SessionService = ReturnType<typeof makeSessionService>;
