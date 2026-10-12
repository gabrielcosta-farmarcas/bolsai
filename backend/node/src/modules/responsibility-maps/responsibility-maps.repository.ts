import { prisma } from '../../shared/database/prisma.js';
import { assertOwnsReport } from '../../shared/security/ownership.js';
import { applyResponsibilities } from '../responsibilities/responsibilities.repository.js';
import type { ResponsibilityMapsRepository } from './responsibility-maps.service.js';

const select = {
  id: true,
  leaderId: true,
  directReportId: true,
  version: true,
  text: true,
  mission: true,
  responsibilities: true,
  createdAt: true,
} as const;

// Visibilidade: a versão só existe para o líder se o liderado dela não foi excluído.
const visibleFor = (leaderId: string) => ({
  leaderId,
  directReport: { leaderId, deletedAt: null },
});

export const responsibilityMapsRepository: ResponsibilityMapsRepository = {
  createNextVersion(leaderId, directReportId, data) {
    return prisma.$transaction(async (tx) => {
      await assertOwnsReport(tx, leaderId, directReportId);
      const last = await tx.responsibilityMap.aggregate({
        where: { directReportId },
        _max: { version: true },
      });
      const created = await tx.responsibilityMap.create({
        data: {
          leaderId,
          directReportId,
          version: (last._max.version ?? 0) + 1,
          // O arquivo original não é mais guardado: só o texto, que é o que importa.
          fileName: null,
          fileType: 'text',
          text: data.text,
          mission: data.mission,
          responsibilities: data.responsibilities,
        },
        select,
      });
      // Reconcilia as responsabilidades na mesma transação: ou salva tudo, ou nada.
      await applyResponsibilities(tx, leaderId, directReportId, data.items);
      return created;
    });
  },

  listByReport(leaderId, directReportId) {
    return prisma.responsibilityMap.findMany({
      where: { ...visibleFor(leaderId), directReportId },
      select,
      orderBy: { version: 'desc' },
    });
  },

  findById(leaderId, id) {
    return prisma.responsibilityMap.findFirst({ where: { ...visibleFor(leaderId), id }, select });
  },

  findCurrent(leaderId, directReportId) {
    return prisma.responsibilityMap.findFirst({
      where: { ...visibleFor(leaderId), directReportId },
      select: { version: true, text: true, mission: true },
      orderBy: { version: 'desc' },
    });
  },
};
