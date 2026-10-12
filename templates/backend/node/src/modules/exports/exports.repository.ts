import { prisma } from '../../shared/database/prisma.js';
import type { ExportsRepository } from './exports.service.js';

export const exportsRepository: ExportsRepository = {
  async findExportable(leaderId, sessionId) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, leaderId, directReport: { leaderId, deletedAt: null } },
      select: {
        id: true,
        leaderId: true,
        heldOn: true,
        directReport: { select: { name: true } },
        // Só a versão final (reviewed_at preenchido); nenhum outro campo da sessão é lido.
        analyses: {
          where: { reviewedAt: { not: null } },
          select: { reviewedJson: true },
          orderBy: { reviewedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!session) return null;
    return {
      id: session.id,
      leaderId: session.leaderId,
      heldOn: session.heldOn,
      reportName: session.directReport.name,
      reviewedJson: session.analyses[0]?.reviewedJson ?? null,
    };
  },

  async markExported(leaderId, sessionId, at) {
    await prisma.session.update({
      where: { id: sessionId, leaderId },
      data: { summaryExportedAt: at },
    });
  },
};
