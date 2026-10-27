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
  steps: {
    select: {
      id: true,
      position: true,
      text: true,
      dueDate: true,
      owner: true,
      doneAt: true,
      agreementId: true,
    },
    orderBy: { position: 'asc' },
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

  async addStep(leaderId, noteId, data) {
    await prisma.$transaction(async (tx) => {
      await tx.note.findFirstOrThrow({ where: ownNote(leaderId, noteId), select: { id: true } });
      const last = await tx.noteStep.aggregate({
        where: { noteId },
        _max: { position: true },
      });
      await tx.noteStep.create({
        data: { ...data, noteId, leaderId, position: (last._max.position ?? 0) + 1 },
      });
    });
    return reload(leaderId, noteId);
  },

  async updateStep(leaderId, noteId, stepId, changes) {
    await prisma.noteStep.update({
      where: { id: stepId, noteId, leaderId, note: visibleFor(leaderId) },
      data: changes,
    });
    return reload(leaderId, noteId);
  },

  async removeStep(leaderId, noteId, stepId) {
    await prisma.noteStep.delete({
      where: { id: stepId, noteId, leaderId, note: visibleFor(leaderId) },
    });
    return reload(leaderId, noteId);
  },

  async promoteStep(leaderId, noteId, stepId, confirmedAt) {
    await prisma.$transaction(async (tx) => {
      const step = await tx.noteStep.findFirstOrThrow({
        where: { id: stepId, noteId, leaderId, note: visibleFor(leaderId) },
        select: {
          text: true,
          dueDate: true,
          owner: true,
          agreementId: true,
          note: { select: { directReportId: true } },
        },
      });
      // Outra chamada pode ter promovido o passo no meio do caminho: não cria um segundo Combinado.
      if (step.agreementId) return;
      const agreement = await tx.agreement.create({
        data: {
          leaderId,
          directReportId: step.note.directReportId,
          description: step.text,
          owner: step.owner,
          dueDate: step.dueDate,
          origin: 'leader',
          status: 'open',
          confirmedAt,
        },
        select: { id: true },
      });
      await tx.noteStep.update({ where: { id: stepId }, data: { agreementId: agreement.id } });
    });
    return reload(leaderId, noteId);
  },
};
