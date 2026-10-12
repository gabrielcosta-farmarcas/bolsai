import { beforeEach, describe, expect, it } from 'vitest';
import { makeFakeOidc, sampleTokens } from '../../test/fake-oidc.js';
import { hashSessionToken, loadKey } from '../../shared/security/session-crypto.js';
import type { LeaderLinkRepository } from './leader-link.repository.js';
import type { NewSession, SessionRepository, SessionRow } from './session.repository.js';
import {
  SESSION_IDLE_MS,
  SESSION_MAX_MS,
  SESSION_REFRESH_MS,
  makeSessionService,
} from './session.service.js';

const key = loadKey(Buffer.alloc(32, 9).toString('base64'));

const makeMemoryRepository = () => {
  const rows = new Map<string, SessionRow>();
  const repository: SessionRepository = {
    create(data: NewSession) {
      rows.set(data.id, { ...data, createdAt: data.lastUsedAt });
      return Promise.resolve();
    },
    findById: (id) => Promise.resolve(rows.get(id) ?? null),
    update(id, data) {
      const row = rows.get(id);
      if (row) rows.set(id, { ...row, ...data });
      return Promise.resolve();
    },
    deleteById: (id) => Promise.resolve(void rows.delete(id)),
    deleteByKeycloakSession(sid) {
      let count = 0;
      for (const [id, row] of rows) if (row.kcSid === sid && rows.delete(id)) count += 1;
      return Promise.resolve(count);
    },
    deleteBySubject(subject) {
      let count = 0;
      for (const [id, row] of rows) if (row.subject === subject && rows.delete(id)) count += 1;
      return Promise.resolve(count);
    },
    deleteExpired: () => Promise.resolve(0),
  };
  return { rows, repository };
};

describe('session service', () => {
  let clock: Date;
  let memory: ReturnType<typeof makeMemoryRepository>;
  let fake: ReturnType<typeof makeFakeOidc>;
  let linked: Array<{ subject: string; name: string | null }>;
  let service: ReturnType<typeof makeSessionService>;

  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms);
  };

  beforeEach(() => {
    clock = new Date('2026-10-11T12:00:00Z');
    memory = makeMemoryRepository();
    fake = makeFakeOidc();
    linked = [];
    const leaders: LeaderLinkRepository = {
      linkLeader(subject, name) {
        linked.push({ subject, name });
        return Promise.resolve('leader-1');
      },
    };
    service = makeSessionService({
      repository: memory.repository,
      oidc: fake.provider,
      leaders,
      key,
      now: () => clock,
    });
  });

  it('deve criar a sessão guardando só o hash do cookie e os tokens cifrados', async () => {
    const { cookieValue, maxAgeMs } = await service.create(sampleTokens());

    const row = memory.rows.get(hashSessionToken(cookieValue));
    expect(maxAgeMs).toBe(SESSION_MAX_MS);
    expect(memory.rows.has(cookieValue)).toBe(false);
    expect(row?.tokensEnc).not.toContain('refresh-token-1');
    expect(row?.tokensEnc).not.toContain('id-token-1');
    expect(row?.leaderId).toBe('leader-1');
  });

  it('deve dar um valor de cookie novo a cada login', async () => {
    const first = await service.create(sampleTokens());
    const second = await service.create(sampleTokens());

    expect(first.cookieValue).not.toBe(second.cookieValue);
  });

  it('não deve criar líder para quem não tem o papel lider', async () => {
    const { cookieValue } = await service.create(sampleTokens({ roles: ['administrador'] }));

    const user = await service.resolve(cookieValue);

    expect(linked).toHaveLength(0);
    expect(user?.leaderId).toBeNull();
    expect(user?.roles).toEqual(['administrador']);
  });

  it('deve reconhecer a sessão e recusar valores desconhecidos', async () => {
    const { cookieValue } = await service.create(sampleTokens());

    expect((await service.resolve(cookieValue))?.email).toBe('ana@empresa.com.br');
    expect(await service.resolve('qualquer-coisa')).toBeNull();
    expect(await service.resolve(undefined)).toBeNull();
  });

  it('deve encerrar a sessão depois de 30 minutos parada', async () => {
    const { cookieValue } = await service.create(sampleTokens());

    advance(SESSION_IDLE_MS + 1000);

    expect(await service.resolve(cookieValue)).toBeNull();
    expect(memory.rows.size).toBe(0);
  });

  it('deve encerrar a sessão depois de 10 horas, mesmo com uso constante', async () => {
    const { cookieValue } = await service.create(sampleTokens());

    for (let elapsed = 0; elapsed < SESSION_MAX_MS; elapsed += 20 * 60 * 1000) {
      advance(20 * 60 * 1000);
      if (elapsed + 20 * 60 * 1000 < SESSION_MAX_MS) {
        expect(await service.resolve(cookieValue)).not.toBeNull();
      }
    }

    expect(await service.resolve(cookieValue)).toBeNull();
  });

  it('deve conferir com o Keycloak a cada 5 minutos e atualizar os papéis', async () => {
    const { cookieValue } = await service.create(sampleTokens());
    fake.control.refreshResult = sampleTokens({
      roles: ['lider', 'administrador'],
      refreshToken: 'novo',
    });

    await service.resolve(cookieValue);
    expect(fake.control.refreshCalls).toBe(0);

    advance(SESSION_REFRESH_MS + 1000);
    const user = await service.resolve(cookieValue);

    expect(fake.control.refreshCalls).toBe(1);
    expect(user?.roles).toEqual(['lider', 'administrador']);
  });

  it('deve derrubar a sessão quando o Keycloak recusa a renovação (conta desativada)', async () => {
    const { cookieValue } = await service.create(sampleTokens());
    fake.control.refreshFails = true;

    advance(SESSION_REFRESH_MS + 1000);

    expect(await service.resolve(cookieValue)).toBeNull();
    expect(memory.rows.size).toBe(0);
  });

  it('deve derrubar a sessão se a renovação trouxer outra pessoa', async () => {
    const { cookieValue } = await service.create(sampleTokens());
    fake.control.refreshResult = sampleTokens({ subject: 'outra-pessoa' });

    advance(SESSION_REFRESH_MS + 1000);

    expect(await service.resolve(cookieValue)).toBeNull();
  });

  it('deve tirar o vínculo de líder quando o papel é retirado', async () => {
    const { cookieValue } = await service.create(sampleTokens());
    fake.control.refreshResult = sampleTokens({ roles: ['administrador'] });

    advance(SESSION_REFRESH_MS + 1000);
    const user = await service.resolve(cookieValue);

    expect(user?.leaderId).toBeNull();
  });

  it('deve encerrar por logout do Keycloak, por sessão ou por pessoa', async () => {
    const a = await service.create(sampleTokens({ kcSid: 'sid-a' }));
    const b = await service.create(sampleTokens({ kcSid: 'sid-b' }));
    const c = await service.create(sampleTokens({ subject: 'user-2', kcSid: 'sid-c' }));

    await service.destroyFromKeycloak({ sid: 'sid-a', sub: null });
    expect(await service.resolve(a.cookieValue)).toBeNull();
    expect(await service.resolve(b.cookieValue)).not.toBeNull();

    await service.destroyFromKeycloak({ sid: null, sub: 'user-1' });
    expect(await service.resolve(b.cookieValue)).toBeNull();
    expect(await service.resolve(c.cookieValue)).not.toBeNull();
  });

  it('deve apagar a sessão ao sair e devolver o id token só enquanto ela existe', async () => {
    const { cookieValue } = await service.create(sampleTokens());

    expect(await service.idTokenOf(cookieValue)).toBe('id-token-1');
    await service.destroy(cookieValue);

    expect(await service.idTokenOf(cookieValue)).toBeNull();
    expect(await service.resolve(cookieValue)).toBeNull();
  });
});
