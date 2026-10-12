import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';

type Db = PrismaClient | Prisma.TransactionClient;

// Garantia no banco: antes de criar algo ligado a uma pessoa ou encontro, confere que é da mesma líder.
// Se não for (id de outra líder, excluído ou inexistente), lança o erro P2025, que a API responde como 404.
export const assertOwnsReport = (db: Db, leaderId: string, directReportId: string) =>
  db.directReport.findFirstOrThrow({
    where: { id: directReportId, leaderId, deletedAt: null },
    select: { id: true },
  });

export const assertOwnsSession = (db: Db, leaderId: string, sessionId: string) =>
  db.session.findFirstOrThrow({
    where: { id: sessionId, leaderId, directReport: { leaderId, deletedAt: null } },
    select: { id: true },
  });
