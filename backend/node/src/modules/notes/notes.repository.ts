import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { assertOwnsReport } from '../../shared/security/ownership.js';
import type { NoteRecord, NotesRepository } from './notes.service.js';

const select = {
  id: true,
  leaderId: true,
  directReportId: true,
  kind: true,
  description: true,
  notedAt: true,
  resolvedAt: true,
  bringToNextSession: true,
  createdAt: true,
  // Combinados ligados à anotação (os cancelados saem da vista).
  agreements: {
    where: { status: { not: 'cancelled' } },
    select: { id: true, description: true, owner: true, dueDate: true, status: true },
    orderBy: { createdAt: 'asc' },
  },
} as const satisfies Prisma.NoteSelect;

// Visibilidade: a anotação só existe para a líder se não foi excluída e a pessoa também não.
const visibleFor = (leaderId: string) => ({
  leaderId,
  deletedAt: null,
  directReport: { leaderId, deletedAt: null },
});

const ownNote = (leaderId: string, id: string) => ({ id, ...visibleFor(leaderId) });

const reload = (leaderId: string, id: string): Promise<NoteRecord> =>
  prisma.note.findFirstOrThrow({ where: ownNote(leaderId, id), select });

export const notesRepository: NotesRepository = {
  listByReport: (leaderId, directReportId) =>
    prisma.note.findMany({
      where: { ...visibleFor(leaderId), directReportId },
      select,
      orderBy: [{ notedAt: 'desc' }, { createdAt: 'desc' }],
    }),

  findById: (leaderId, id) => prisma.note.findFirst({ where: ownNote(leaderId, id), select }),

  create: (leaderId, directReportId, data) =>
    prisma.$transaction(async (tx) => {
      await assertOwnsReport(tx, leaderId, directReportId);
      return tx.note.create({ data: { ...data, leaderId, directReportId }, select });
    }),

  async update(leaderId, id, changes) {
    await prisma.note.update({ where: ownNote(leaderId, id), data: changes });
    return reload(leaderId, id);
  },

  async remove(leaderId, id, deletedAt) {
    await prisma.note.update({ where: ownNote(leaderId, id), data: { deletedAt } });
  },

  async addAgreement(leaderId, noteId, data, confirmedAt) {
    await prisma.$transaction(async (tx) => {
      const note = await tx.note.findFirstOrThrow({
        where: ownNote(leaderId, noteId),
        select: { directReportId: true },
      });
      await tx.agreement.create({
        data: {
          ...data,
          leaderId,
          directReportId: note.directReportId,
          noteId,
          origin: 'leader',
          status: 'open',
          confirmedAt,
        },
      });
    });
    return reload(leaderId, noteId);
  },
};
