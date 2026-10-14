import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { provisionalTitle } from '../responsibilities/normalize.js';
import type { DirectReportRecord, DirectReportsRepository } from './direct-reports.service.js';

const active = { deletedAt: null } as const;

const toDate = (calendarDate: string) => new Date(`${calendarDate}T00:00:00.000Z`);

const select = {
  id: true,
  leaderId: true,
  name: true,
  role: true,
  startedAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  // Último encontro e combinados em aberto (para o resumo na lista de pessoas).
  sessions: { select: { heldOn: true }, orderBy: { heldOn: 'desc' }, take: 1 },
  _count: { select: { agreements: { where: { status: 'open' } } } },
} as const;

type Row = Prisma.DirectReportGetPayload<{ select: typeof select }>;

const toRecord = ({ sessions, _count, ...row }: Row): DirectReportRecord => ({
  ...row,
  lastSessionOn: sessions[0]?.heldOn ?? null,
  openAgreements: _count.agreements,
});

export const directReportsRepository: DirectReportsRepository = {
  async list(leaderId, filter, page) {
    const where = { leaderId, ...active, ...(filter.status ? { status: filter.status } : {}) };
    const [data, total] = await prisma.$transaction([
      prisma.directReport.findMany({
        where,
        select,
        skip: page.skip,
        take: page.take,
        orderBy: { name: 'asc' },
      }),
      prisma.directReport.count({ where }),
    ]);
    return { data: data.map(toRecord), total };
  },

  async findById(leaderId, id) {
    const row = await prisma.directReport.findFirst({ where: { id, leaderId, ...active }, select });
    return row ? toRecord(row) : null;
  },

  async create(leaderId, input) {
    const row = await prisma.directReport.create({
      data: {
        name: input.name,
        role: input.role,
        status: input.status,
        leaderId,
        startedAt: toDate(input.startedAt),
        maps: {
          create: {
            leaderId,
            version: 1,
            fileType: 'text',
            text: input.initialMap.text,
            mission: input.initialMap.mission,
            behaviors: input.initialMap.behaviors,
            responsibilities: input.initialMap.responsibilities,
          },
        },
        responsibilities: {
          create: input.initialMap.items.map((item, index) => ({
            leaderId,
            position: index + 1,
            text: item.text,
            key: item.key,
            title: provisionalTitle(item.text),
          })),
        },
      },
      select,
    });
    return toRecord(row);
  },

  async update(leaderId, id, input) {
    const { startedAt, ...rest } = input;
    const row = await prisma.directReport.update({
      where: { id, leaderId, ...active },
      data: { ...rest, ...(startedAt ? { startedAt: toDate(startedAt) } : {}) },
      select,
    });
    return toRecord(row);
  },

  async softDelete(leaderId, id) {
    await prisma.directReport.update({
      where: { id, leaderId, ...active },
      data: { deletedAt: new Date() },
    });
  },
};
