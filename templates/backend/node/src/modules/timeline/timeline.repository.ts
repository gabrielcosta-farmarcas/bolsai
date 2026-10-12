import { prisma } from '../../shared/database/prisma.js';
import type { TimelineRepository } from './timeline.service.js';

// Visibilidade: só liderado do líder e não excluído.
const visibleFor = (leaderId: string) => ({
  leaderId,
  directReport: { leaderId, deletedAt: null },
});

export const timelineRepository: TimelineRepository = {
  async loadResponsibilityTitles(leaderId, directReportId) {
    const rows = await prisma.responsibility.findMany({
      where: { ...visibleFor(leaderId), directReportId },
      select: { id: true, title: true, text: true },
    });
    return new Map(rows.map((row) => [row.id, { title: row.title, text: row.text }]));
  },

  async loadSessions(leaderId, directReportId) {
    const rows = await prisma.session.findMany({
      where: { ...visibleFor(leaderId), directReportId },
      select: {
        id: true,
        heldOn: true,
        status: true,
        analyses: {
          where: { status: 'completed' },
          select: { rawJson: true, reviewedJson: true, reviewedAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { heldOn: 'asc' },
    });

    return rows.map((row) => {
      // A versão final vem primeiro; sem ela, a última análise concluída.
      const chosen = row.analyses.find((item) => item.reviewedAt !== null) ?? row.analyses[0];
      return {
        id: row.id,
        heldOn: row.heldOn,
        status: row.status,
        analysis: chosen
          ? {
              rawJson: chosen.rawJson,
              reviewedJson: chosen.reviewedAt ? chosen.reviewedJson : null,
              isFinal: chosen.reviewedAt !== null,
            }
          : null,
      };
    });
  },

  async loadAgreements(leaderId, directReportId) {
    return prisma.agreement.findMany({
      where: { ...visibleFor(leaderId), directReportId },
      select: {
        id: true,
        originSessionId: true,
        description: true,
        owner: true,
        dueDate: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  },
};
