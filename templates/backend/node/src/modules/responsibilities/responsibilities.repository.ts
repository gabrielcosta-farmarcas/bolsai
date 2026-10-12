import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { provisionalTitle } from './normalize.js';
import { reconcile } from './reconcile.js';
import type { CheckedResponsibility } from './responsibilities.schemas.js';
import type {
  ResponsibilitiesRepository,
  ResponsibilityRecord,
} from './responsibilities.service.js';

type Db = PrismaClient | Prisma.TransactionClient;

// Só existe para a líder se a pessoa dela não foi excluída.
const visibleFor = (leaderId: string) => ({
  leaderId,
  directReport: { leaderId, deletedAt: null },
});

const select = {
  id: true,
  leaderId: true,
  directReportId: true,
  position: true,
  title: true,
  titleSource: true,
  text: true,
  retiredAt: true,
  createdAt: true,
} as const;

type Row = Prisma.ResponsibilityGetPayload<{ select: typeof select }>;

const toRecord = ({ retiredAt, ...row }: Row): ResponsibilityRecord => ({
  ...row,
  retired: retiredAt !== null,
});

// Aplica o resultado da reconciliação (versão nova do responsograma) usando a transação de quem chama.
// A criação já confere que a pessoa é da líder.
export const applyResponsibilities = async (
  tx: Db,
  leaderId: string,
  directReportId: string,
  items: CheckedResponsibility[],
) => {
  const existing = await tx.responsibility.findMany({
    where: { leaderId, directReportId },
    select: { id: true, key: true, position: true, retiredAt: true },
  });
  const plan = reconcile(
    existing.map((row) => ({
      id: row.id,
      key: row.key,
      position: row.position,
      retired: row.retiredAt !== null,
    })),
    items,
  );
  const textByKey = new Map(items.map((item) => [item.key, item.text]));
  const keyById = new Map(existing.map((row) => [row.id, row.key]));

  for (const kept of plan.keep) {
    await tx.responsibility.update({
      where: { id: kept.id, leaderId },
      data: { position: kept.position, text: textByKey.get(keyById.get(kept.id) ?? '') },
    });
  }
  for (const back of plan.reactivate) {
    await tx.responsibility.update({
      where: { id: back.id, leaderId },
      data: {
        position: back.position,
        retiredAt: null,
        text: textByKey.get(keyById.get(back.id) ?? ''),
      },
    });
  }
  if (plan.retire.length > 0) {
    await tx.responsibility.updateMany({
      where: { id: { in: plan.retire }, leaderId },
      data: { retiredAt: new Date() },
    });
  }
  for (const created of plan.create) {
    await tx.responsibility.create({
      data: {
        leaderId,
        directReportId,
        position: created.position,
        text: created.text,
        key: created.key,
        title: provisionalTitle(created.text),
        titleSource: 'fallback',
      },
    });
  }
};

export const responsibilitiesRepository: ResponsibilitiesRepository = {
  async listByReport(leaderId, directReportId, { includeRetired }) {
    const rows = await prisma.responsibility.findMany({
      where: {
        ...visibleFor(leaderId),
        directReportId,
        ...(includeRetired ? {} : { retiredAt: null }),
      },
      select,
      orderBy: [{ retiredAt: { sort: 'asc', nulls: 'first' } }, { position: 'asc' }],
    });
    return rows.map(toRecord);
  },

  listAll(leaderId, directReportId) {
    return responsibilitiesRepository.listByReport(leaderId, directReportId, {
      includeRetired: true,
    });
  },

  async findById(leaderId, id) {
    const row = await prisma.responsibility.findFirst({
      where: { ...visibleFor(leaderId), id },
      select,
    });
    return row ? toRecord(row) : null;
  },

  async updateTitle(leaderId, id, title) {
    const row = await prisma.responsibility.update({
      where: { id, leaderId },
      data: { title, titleSource: 'leader' },
      select,
    });
    return toRecord(row);
  },

  // Só troca o título de reserva: o que a líder escreveu nunca é sobrescrito.
  async setAiTitles(leaderId, updates) {
    for (const update of updates) {
      await prisma.responsibility.updateMany({
        where: { id: update.id, leaderId, titleSource: 'fallback' },
        data: { title: update.title, titleSource: 'ai' },
      });
    }
  },
};
