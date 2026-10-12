import { prisma } from '../../shared/database/prisma.js';
import { assertOwnsReport } from '../../shared/security/ownership.js';
import type { SessionsRepository } from './sessions.service.js';

const listSelect = {
  id: true,
  leaderId: true,
  directReportId: true,
  heldOn: true,
  status: true,
  summaryExportedAt: true,
  createdAt: true,
} as const;

const detailSelect = { ...listSelect, transcript: true } as const;

const toDate = (calendarDate: string) => new Date(`${calendarDate}T00:00:00.000Z`);

// Visibilidade: a sessão só existe para o líder se o liderado dela não foi excluído.
const visibleFor = (leaderId: string) => ({
  leaderId,
  directReport: { leaderId, deletedAt: null },
});

export const sessionsRepository: SessionsRepository = {
  create(leaderId, directReportId, data) {
    return prisma.$transaction(async (tx) => {
      await assertOwnsReport(tx, leaderId, directReportId);
      return tx.session.create({
        data: {
          leaderId,
          directReportId,
          transcript: data.transcript,
          heldOn: toDate(data.heldOn),
        },
        select: detailSelect,
      });
    });
  },

  listByReport(leaderId, directReportId) {
    return prisma.session.findMany({
      where: { ...visibleFor(leaderId), directReportId },
      select: listSelect,
      orderBy: [{ heldOn: 'desc' }, { createdAt: 'desc' }],
    });
  },

  findById(leaderId, id) {
    return prisma.session.findFirst({
      where: { ...visibleFor(leaderId), id },
      select: detailSelect,
    });
  },

  update(leaderId, id, data) {
    return prisma.session.update({
      where: { id, leaderId },
      data: {
        ...(data.transcript !== undefined ? { transcript: data.transcript } : {}),
        ...(data.heldOn ? { heldOn: toDate(data.heldOn) } : {}),
      },
      select: detailSelect,
    });
  },
};
