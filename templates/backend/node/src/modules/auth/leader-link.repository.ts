import { prisma } from '../../shared/database/prisma.js';
import { FIXED_LEADER_ID } from '../../shared/security/current-user.js';

export type LeaderLinkRepository = {
  // Devolve a líder ligada a este usuário do Keycloak, criando ou "adotando" se for a primeira vez.
  linkLeader(subject: string, name: string | null): Promise<string>;
};

export const leaderLinkRepository: LeaderLinkRepository = {
  async linkLeader(subject, name) {
    const displayName = name ?? 'Líder';
    return prisma.$transaction(async (tx) => {
      const existing = await tx.leader.findUnique({ where: { keycloakSubject: subject } });
      if (existing) return existing.id;

      // A líder do MVP 1 (com todos os dados já criados) passa para a primeira pessoa que entrar.
      // updateMany com "ainda sem dono" garante que só uma pessoa a adota, mesmo com entradas simultâneas.
      const adopted = await tx.leader.updateMany({
        where: { id: FIXED_LEADER_ID, keycloakSubject: null },
        data: { keycloakSubject: subject, name: displayName },
      });
      if (adopted.count === 1) return FIXED_LEADER_ID;

      const created = await tx.leader.create({
        data: { name: displayName, keycloakSubject: subject },
      });
      return created.id;
    });
  },
};
