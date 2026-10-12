import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { fromCalendarDate } from '../../shared/dates.js';
import type { AnalysisOutput, ReviewedAnalysis } from '../analyses/analysis.schema.js';

// Escritas de combinados que acontecem dentro da transação de uma análise (concluir ou revisar).
type Tx = Prisma.TransactionClient;

const uuidSchema = z.string().uuid();

type Scope = { leaderId: string; directReportId: string; sessionId: string; analysisId: string };

// Ao concluir uma análise: salva sozinho os combinados que a IA achou, para valerem no próximo encontro.
// Substitui só os da IA que o líder ainda não tocou. Se o encontro já tem versão final, não mexe em nada.
export async function saveAiAgreements(
  tx: Tx,
  scope: Scope,
  items: AnalysisOutput['agreements'],
): Promise<'saved' | 'skipped'> {
  const finals = await tx.analysis.count({
    where: { sessionId: scope.sessionId, reviewedAt: { not: null } },
  });
  if (finals > 0) return 'skipped';

  await tx.agreement.deleteMany({
    where: { originSessionId: scope.sessionId, origin: 'ai', confirmedAt: null },
  });
  if (items.length > 0) {
    await tx.agreement.createMany({
      data: items.map((item) => ({
        leaderId: scope.leaderId,
        directReportId: scope.directReportId,
        originSessionId: scope.sessionId,
        analysisId: scope.analysisId,
        description: item.description,
        owner: item.owner,
        dueDate: item.due_date ? fromCalendarDate(item.due_date) : null,
        evidenceExcerpt: item.evidence_excerpt,
        origin: 'ai' as const,
      })),
    });
  }
  return 'saved';
}

// Ao salvar a revisão: os combinados passam a seguir o que o líder deixou na tela e ficam confirmados.
// Também aplica, só agora, a situação dos combinados anteriores que o líder confirmou (concluído/cancelado).
export async function reconcileReview(
  tx: Tx,
  scope: Scope,
  reviewed: ReviewedAnalysis,
  aiDescriptions: Set<string>,
  now: Date,
): Promise<void> {
  const existing = await tx.agreement.findMany({ where: { originSessionId: scope.sessionId } });
  const byId = new Map(existing.map((row) => [row.id, row]));
  const kept = new Set<string>();

  for (const item of reviewed.agreements) {
    const data = {
      description: item.description,
      owner: item.owner,
      dueDate: item.due_date ? fromCalendarDate(item.due_date) : null,
      evidenceExcerpt: item.evidence_excerpt,
    };
    // Sem id (ou id antigo), reconhece o mesmo combinado pelo texto, para não duplicar.
    const row =
      (item.id ? byId.get(item.id) : undefined) ??
      existing.find(
        (candidate) =>
          !kept.has(candidate.id) &&
          candidate.description.trim().toLowerCase() === item.description.trim().toLowerCase(),
      );
    if (row) {
      kept.add(row.id);
      await tx.agreement.update({
        where: { id: row.id },
        data: { ...data, confirmedAt: row.confirmedAt ?? now },
      });
    } else {
      await tx.agreement.create({
        data: {
          ...data,
          leaderId: scope.leaderId,
          directReportId: scope.directReportId,
          originSessionId: scope.sessionId,
          analysisId: scope.analysisId,
          origin: aiDescriptions.has(item.description) ? 'ai' : 'leader',
          confirmedAt: now,
        },
      });
    }
  }

  // Combinado aberto que o líder tirou da revisão vira "cancelado" (fica no histórico).
  for (const row of existing) {
    if (!kept.has(row.id) && row.status === 'open') {
      await tx.agreement.update({
        where: { id: row.id },
        data: { status: 'cancelled', closedAt: now, confirmedAt: row.confirmedAt ?? now },
      });
    }
  }

  // Sugestões da IA sobre combinados anteriores só valem depois da confirmação do líder.
  for (const previous of reviewed.previous_agreements) {
    if (!uuidSchema.safeParse(previous.id).success) continue;
    if (previous.suggested_status !== 'done' && previous.suggested_status !== 'cancelled') continue;
    await tx.agreement.updateMany({
      where: {
        id: previous.id,
        leaderId: scope.leaderId,
        directReportId: scope.directReportId,
        status: 'open',
        NOT: { originSessionId: scope.sessionId },
      },
      data: {
        status: previous.suggested_status === 'done' ? 'done' : 'cancelled',
        closedAt: now,
        confirmedAt: now,
      },
    });
  }
}
