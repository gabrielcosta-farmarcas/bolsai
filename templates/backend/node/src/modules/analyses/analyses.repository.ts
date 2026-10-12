import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../shared/database/prisma.js';
import { assertOwnsSession } from '../../shared/security/ownership.js';
import { reconcileReview, saveAiAgreements } from '../agreements/agreements.tx.js';
import { storedAnalysisSchema } from './analysis.schema.js';
import type { AnalysesRepository } from './analyses.service.js';

const select = {
  id: true,
  leaderId: true,
  sessionId: true,
  model: true,
  status: true,
  errorMessage: true,
  mapVersionUsed: true,
  rawJson: true,
  reviewedJson: true,
  reviewedAt: true,
  createdAt: true,
} as const;

// Visibilidade: a análise só existe para o líder se o liderado da sessão não foi excluído.
const visibleFor = (leaderId: string) => ({
  leaderId,
  session: { directReport: { leaderId, deletedAt: null } },
});

const summaryOf = z.object({ summary: z.string() });

export const analysesRepository: AnalysesRepository = {
  create(leaderId, sessionId, data) {
    return prisma.$transaction(async (tx) => {
      await assertOwnsSession(tx, leaderId, sessionId);
      return tx.analysis.create({ data: { leaderId, sessionId, ...data }, select });
    });
  },

  async markCompleted(id, data) {
    await prisma.$transaction(async (tx) => {
      const analysis = await tx.analysis.update({
        where: { id },
        data: {
          status: 'completed',
          rawJson: data.rawJson as Prisma.InputJsonValue,
          model: data.model,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          errorMessage: null,
        },
        select: { sessionId: true, leaderId: true, session: { select: { directReportId: true } } },
      });
      await tx.session.updateMany({
        where: { id: analysis.sessionId, status: 'draft' },
        data: { status: 'analysed' },
      });
      // Os combinados que a IA achou já ficam salvos para o próximo encontro.
      await saveAiAgreements(
        tx,
        {
          leaderId: analysis.leaderId,
          directReportId: analysis.session.directReportId,
          sessionId: analysis.sessionId,
          analysisId: id,
        },
        data.rawJson.agreements,
      );
    });
  },

  async markFailed(id, message) {
    await prisma.analysis.update({
      where: { id },
      data: { status: 'failed', errorMessage: message },
    });
  },

  findById(leaderId, id) {
    return prisma.analysis.findFirst({ where: { ...visibleFor(leaderId), id }, select });
  },

  listBySession(leaderId, sessionId) {
    return prisma.analysis.findMany({
      where: { ...visibleFor(leaderId), sessionId },
      select,
      orderBy: { createdAt: 'desc' },
    });
  },

  saveFinal(leaderId, sessionId, analysisId, reviewedJson, reviewedAt) {
    return prisma.$transaction(async (tx) => {
      // A versão final anterior deixa de ser final (o texto revisado dela fica como histórico).
      await tx.analysis.updateMany({
        where: { sessionId, leaderId, reviewedAt: { not: null }, id: { not: analysisId } },
        data: { reviewedAt: null },
      });
      const saved = await tx.analysis.update({
        where: { id: analysisId, leaderId },
        data: { reviewedJson: reviewedJson as Prisma.InputJsonValue, reviewedAt },
        select,
      });
      const session = await tx.session.update({
        where: { id: sessionId, leaderId },
        data: { status: 'reviewed' },
        select: { directReportId: true },
      });

      const raw = storedAnalysisSchema.safeParse(saved.rawJson);
      await reconcileReview(
        tx,
        { leaderId, directReportId: session.directReportId, sessionId, analysisId },
        reviewedJson,
        new Set(raw.success ? raw.data.agreements.map((item) => item.description) : []),
        reviewedAt,
      );
      return saved;
    });
  },

  async failStuck(message) {
    const result = await prisma.analysis.updateMany({
      where: { status: 'processing' },
      data: { status: 'failed', errorMessage: message },
    });
    return result.count;
  },

  async lastReviewedSummaries(leaderId, directReportId, filter) {
    const rows = await prisma.analysis.findMany({
      where: {
        leaderId,
        reviewedAt: { not: null },
        session: {
          directReportId,
          id: { not: filter.excludeSessionId },
          heldOn: { lte: filter.onOrBefore },
          directReport: { deletedAt: null },
        },
      },
      select: { reviewedJson: true, session: { select: { heldOn: true } } },
      orderBy: { session: { heldOn: 'desc' } },
      take: filter.limit,
    });

    return rows.flatMap((row) => {
      const parsed = summaryOf.safeParse(row.reviewedJson);
      return parsed.success ? [{ heldOn: row.session.heldOn, summary: parsed.data.summary }] : [];
    });
  },
};
