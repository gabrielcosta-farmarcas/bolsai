import { z } from 'zod';
import { MAX_SIGNALS, OUT_OF_SCOPE_REF, type AnalysisOutput } from './analysis.schema.js';

export const fixtureSchema = z.object({
  heldOn: z.string(),
  mission: z.string().nullable(),
  // Todas as responsabilidades enviadas à IA (3 a 10), na ordem: R1, R2…
  responsibilities: z.array(z.string().min(1)).min(3).max(10),
  history: z.array(z.object({ heldOn: z.string(), summary: z.string() })),
  openAgreements: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      owner: z.enum(['leader', 'report']),
      dueDate: z.string().nullable(),
    }),
  ),
  expectedAgreements: z.array(
    z.object({
      keywords: z.array(z.string()),
      owner: z.enum(['leader', 'report']),
      dueDate: z.string().nullable(),
    }),
  ),
  maxExtraAgreements: z.number().int().min(0),
  expectedPrevious: z.array(z.object({ id: z.string(), status: z.string() })),
  // Referências (R2, R4…) que a conversa trata e a IA deveria apontar pelo menos uma vez.
  expectedSignalRefs: z.array(z.string()).optional(),
});

export type Fixture = z.infer<typeof fixtureSchema>;

// Resumo objetivo: ~5 linhas curtas.
export const MAX_SUMMARY_CHARS = 700;

export type EvaluationResult = {
  missingAgreements: string[];
  wrongOwner: string[];
  wrongDueDate: string[];
  extraAgreements: string[];
  tooManyExtras: boolean;
  evidenceNotInTranscript: string[];
  previousMismatches: string[];
  summaryTooLong: boolean;
  leaderFeedbackEmpty: boolean;
  leaderEvidenceNotInTranscript: string[];
  invalidSignalRefs: string[];
  missingSignalRefs: string[];
  tooManySignals: boolean;
  passed: boolean;
};

// Compara sem acento, caixa nem espaços repetidos.
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export const evaluateAnalysis = (
  output: AnalysisOutput,
  fixture: Fixture,
  transcript: string,
): EvaluationResult => {
  const unmatched = [...output.agreements];
  const missingAgreements: string[] = [];
  const wrongOwner: string[] = [];
  const wrongDueDate: string[] = [];

  for (const expected of fixture.expectedAgreements) {
    const label = expected.keywords.join(' + ');
    const index = unmatched.findIndex((item) =>
      expected.keywords.every((keyword) =>
        normalize(item.description).includes(normalize(keyword)),
      ),
    );
    const found = index === -1 ? undefined : unmatched.splice(index, 1)[0];
    if (!found) {
      missingAgreements.push(label);
      continue;
    }
    if (found.owner !== expected.owner) wrongOwner.push(label);
    if (found.due_date !== expected.dueDate) wrongDueDate.push(label);
  }

  const normalizedTranscript = normalize(transcript);
  const evidenceNotInTranscript = output.agreements
    .filter((item) => !normalizedTranscript.includes(normalize(item.evidence_excerpt)))
    .map((item) => item.description);

  const previousMismatches = fixture.expectedPrevious.flatMap((expected) => {
    const actual = output.previous_agreements.find((item) => item.id === expected.id);
    return actual?.suggested_status === expected.status
      ? []
      : [`${expected.id}: esperado ${expected.status}, veio ${actual?.suggested_status ?? 'nada'}`];
  });

  const feedback = output.leader_feedback;
  const leaderFeedbackEmpty = feedback.strengths.length + feedback.opportunities.length === 0;
  const leaderEvidenceNotInTranscript = [...feedback.strengths, ...feedback.opportunities]
    .filter((item) => item.evidence.trim().length > 0)
    .filter((item) => !normalizedTranscript.includes(normalize(item.evidence)))
    .map((item) => item.point);
  const summaryTooLong = output.summary.length > MAX_SUMMARY_CHARS;

  const validRefs = new Set(fixture.responsibilities.map((_, index) => `R${index + 1}`));
  const usedRefs = output.development_signals.map((item) =>
    item.responsibility_ref.trim().toUpperCase(),
  );
  const invalidSignalRefs = usedRefs.filter(
    (ref) => ref !== OUT_OF_SCOPE_REF && !validRefs.has(ref),
  );
  const missingSignalRefs = (fixture.expectedSignalRefs ?? []).filter(
    (ref) => !usedRefs.includes(ref),
  );
  const tooManySignals = output.development_signals.length > MAX_SIGNALS;

  const extraAgreements = unmatched.map((item) => item.description);
  const tooManyExtras = extraAgreements.length > fixture.maxExtraAgreements;

  return {
    missingAgreements,
    wrongOwner,
    wrongDueDate,
    extraAgreements,
    tooManyExtras,
    evidenceNotInTranscript,
    previousMismatches,
    summaryTooLong,
    leaderFeedbackEmpty,
    leaderEvidenceNotInTranscript,
    invalidSignalRefs,
    missingSignalRefs,
    tooManySignals,
    passed:
      missingAgreements.length === 0 &&
      wrongOwner.length === 0 &&
      wrongDueDate.length === 0 &&
      !tooManyExtras &&
      evidenceNotInTranscript.length === 0 &&
      previousMismatches.length === 0 &&
      !summaryTooLong &&
      !leaderFeedbackEmpty &&
      leaderEvidenceNotInTranscript.length === 0 &&
      invalidSignalRefs.length === 0 &&
      missingSignalRefs.length === 0 &&
      !tooManySignals,
  };
};
