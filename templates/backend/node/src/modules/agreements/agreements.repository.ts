import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { fromCalendarDate, toCalendarDate } from '../../shared/dates.js';
import { assertOwnsReport } from '../../shared/security/ownership.js';
import type {
  AgreementFilter,
  AgreementRecord,
  AgreementsRepository,
} from './agreements.service.js';

const select = {
  id: true,
  leaderId: true,
  directReportId: true,
  originSessionId: true,
  analysisId: true,
  description: true,
  owner: true,
  dueDate: true,
  status: true,
  evidenceExcerpt: true,
  origin: true,
  confirmedAt: true,
  closedAt: true,
  createdAt: true,
  directReport: { select: { name: true } },
} as const;

type Row = Prisma.AgreementGetPayload<{ select: typeof select }>;

const toRecord = ({ directReport, ...row }: Row): AgreementRecord => ({
  ...row,
  directReportName: directReport.name,
});

// Visibilidade: o combinado só existe para o líder se o liderado dele não foi excluído.
const visibleFor = (leaderId: string) => ({
  leaderId,
  directReport: { leaderId, deletedAt: null },
});

// Abertos primeiro, depois por prazo (sem prazo por último) e do mais novo para o mais antigo.
const ordering: Prisma.AgreementOrderByWithRelationInput[] = [
  { status: 'asc' },
  { dueDate: { sort: 'asc', nulls: 'last' } },
  { createdAt: 'desc' },
];

const whereFor = (leaderId: string, filter: AgreementFilter): Prisma.AgreementWhereInput => ({
  ...visibleFor(leaderId),
  ...(filter.directReportId ? { directReportId: filter.directReportId } : {}),
  ...(filter.status ? { status: filter.status } : {}),
  ...(filter.overdueBefore ? { dueDate: { lt: fromCalendarDate(filter.overdueBefore) } } : {}),
});

export const agreementsRepository: AgreementsRepository = {
  async list(leaderId, filter, page) {
    const where = whereFor(leaderId, filter);
    const [rows, total] = await prisma.$transaction([
      prisma.agreement.findMany({
        where,
        select,
        orderBy: ordering,
        skip: page.skip,
        take: page.take,
      }),
      prisma.agreement.count({ where }),
    ]);
    return { data: rows.map(toRecord), total };
  },

  async listByReport(leaderId, directReportId) {
    const rows = await prisma.agreement.findMany({
      where: { ...visibleFor(leaderId), directReportId },
      select,
      orderBy: ordering,
    });
    return rows.map(toRecord);
  },

  async listBySession(leaderId, sessionId) {
    const rows = await prisma.agreement.findMany({
      where: { ...visibleFor(leaderId), originSessionId: sessionId },
      select,
      orderBy: [{ createdAt: 'asc' }],
    });
    return rows.map(toRecord);
  },

  async findById(leaderId, id) {
    const row = await prisma.agreement.findFirst({
      where: { ...visibleFor(leaderId), id },
      select,
    });
    return row ? toRecord(row) : null;
  },

  async create(leaderId, directReportId, data) {
    const row = await prisma.$transaction(async (tx) => {
      await assertOwnsReport(tx, leaderId, directReportId);
      return tx.agreement.create({
        data: { ...data, leaderId, directReportId, origin: 'leader', status: 'open' },
        select,
      });
    });
    return toRecord(row);
  },

  async update(leaderId, id, changes) {
    const row = await prisma.agreement.update({
      where: { id, leaderId },
      data: changes,
      select,
    });
    return toRecord(row);
  },

  async listOpen(leaderId, directReportId, filter) {
    const rows = await prisma.agreement.findMany({
      where: {
        ...visibleFor(leaderId),
        directReportId,
        status: 'open',
        // Combinados de outros encontros anteriores (ou criados à mão, sem encontro).
        OR: [
          { originSessionId: null },
          {
            originSessionId: { not: filter.excludeSessionId },
            originSession: { heldOn: { lte: filter.onOrBefore } },
          },
        ],
      },
      select: { id: true, description: true, owner: true, dueDate: true },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      description: row.description,
      owner: row.owner,
      dueDate: toCalendarDate(row.dueDate),
    }));
  },
};
