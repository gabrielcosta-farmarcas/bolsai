import { AsyncLocalStorage } from 'node:async_hooks';
import { ForbiddenError } from '../errors/forbidden-error.js';
import { UnauthorizedError } from '../errors/unauthorized-error.js';

// Líder criada pela migration do MVP 1. Hoje só serve para ser "adotada" pela primeira líder
// que entrar (modules/auth/leader-link.repository.ts); nenhuma requisição usa este id direto.
export const FIXED_LEADER_ID = '00000000-0000-7000-8000-000000000001';

// Quem está logado nesta requisição (vem da sessão, nunca de dados enviados pelo cliente).
export type AuthUser = {
  sessionId: string;
  subject: string;
  email: string | null;
  name: string | null;
  roles: string[];
  // Só existe para quem tem o papel `lider`; administrador sem esse papel fica sem.
  leaderId: string | null;
};

export type CurrentUser = {
  leaderId: string;
};

const storage = new AsyncLocalStorage<AuthUser>();

export const runWithUser = <T>(user: AuthUser, work: () => T): T => storage.run(user, work);

export const getAuthUser = (): AuthUser => {
  const user = storage.getStore();
  if (!user) throw new UnauthorizedError();
  return user;
};

// Ponto único do "usuário atual" para os services de conteúdo de 1:1.
// Sem entrar: 401. Entrou, mas sem papel de líder: 403.
export const getCurrentUser = (): CurrentUser => {
  const user = getAuthUser();
  if (!user.leaderId) throw new ForbiddenError();
  return { leaderId: user.leaderId };
};

export const hasRole = (user: AuthUser, role: string): boolean => user.roles.includes(role);
