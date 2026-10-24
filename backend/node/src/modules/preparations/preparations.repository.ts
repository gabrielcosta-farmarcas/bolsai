import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { assertOwnsReport } from '../../shared/security/ownership.js';
import type { PreparationsRepository } from './preparations.service.js';

const select = {
  id: true,
  leaderId: true,
  directReportId: true,
  model: true,
  status: true,
  errorMessage: true,
  mapVersionUsed: true,
  content: true,
  createdAt: true,
} as const;

// Visibilidade: o roteiro só existe para a líder se a pessoa dela não foi excluída.
const visibleFor = (leaderId: string) => ({
  leaderId,
  directReport: { leaderId, deletedAt: null },
});

export const preparationsRepository: PreparationsRepository = {
  create(leaderId, directReportId, data) {
    return prisma.$transaction(async (tx) => {
      await assertOwnsReport(tx, leaderId, directReportId);
      return tx.preparation.create({ data: { leaderId, directReportId, ...data }, select });
    });
  },

  async markCompleted(id, data) {
    await prisma.preparation.update({
      where: { id },
      data: {
        status: 'completed',
        content: data.content as Prisma.InputJsonValue,
        model: data.model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        errorMessage: null,
      },
    });
  },

  async markFailed(id, message) {
    await prisma.preparation.updateMany({
      where: { id },
      data: { status: 'failed', errorMessage: message },
    });
  },

  findLatest(leaderId, directReportId) {
    return prisma.preparation.findFirst({
      where: { ...visibleFor(leaderId), directReportId },
      select,
      orderBy: { createdAt: 'desc' },
    });
  },

  async reviewedHistory(leaderId, directReportId) {
    const rows = await prisma.analysis.findMany({
      where: {
        leaderId,
        reviewedAt: { not: null },
        session: { directReportId, directReport: { leaderId, deletedAt: null } },
      },
      select: { reviewedJson: true, session: { select: { heldOn: true } } },
      orderBy: { session: { heldOn: 'desc' } },
    });
    return rows.map((row) => ({ heldOn: row.session.heldOn, reviewedJson: row.reviewedJson }));
  },

  async failStuck(message) {
    const result = await prisma.preparation.updateMany({
      where: { status: 'processing' },
      data: { status: 'failed', errorMessage: message },
    });
    return result.count;
  },
};
