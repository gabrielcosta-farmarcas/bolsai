import { z } from 'zod';

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');

export const agreementOwnerSchema = z.enum(['leader', 'report']);

const agreementSchema = z.object({
  description: z.string().min(1),
  owner: agreementOwnerSchema,
  due_date: calendarDate.nullable(),
  evidence_excerpt: z.string().min(1),
});

// Feedback sobre a condução do líder neste encontro. Só para o líder: nunca vai para a pessoa nem
// para a exportação. Baseado em comportamentos observáveis na conversa.
export const leaderFeedbackSchema = z.object({
  overall: z.enum(['went_well', 'mixed', 'room_to_improve']),
  overall_note: z.string().min(1),
  strengths: z.array(z.object({ point: z.string().min(1), evidence: z.string() })),
  opportunities: z.array(
    z.object({ point: z.string().min(1), suggestion: z.string().min(1), evidence: z.string() }),
  ),
});

export const signalKindSchema = z.enum(['growth', 'attention', 'neutral']);

// Referência que a IA usa para apontar uma responsabilidade da lista que recebeu: R1, R2… ou FORA
// (a observação não combina com nenhuma). O servidor troca R1… pelo id da responsabilidade ao guardar.
export const OUT_OF_SCOPE_REF = 'FORA';
export const MAX_SIGNALS = 5;

// Saída que a IA deve produzir. Os valores de texto são em português do Brasil.
export const analysisOutputSchema = z.object({
  summary: z.string().min(1),
  themes: z.array(z.object({ title: z.string().min(1), detail: z.string() })),
  agreements: z.array(agreementSchema),
  previous_agreements: z.array(
    z.object({
      id: z.string().min(1),
      suggested_status: z.enum(['done', 'in_progress', 'not_mentioned', 'cancelled']),
      evidence: z.string(),
    }),
  ),
  development_signals: z.array(
    z.object({
      responsibility_ref: z.string().min(1),
      observation: z.string().min(1),
      kind: signalKindSchema,
    }),
  ),
  attention_points: z.array(z.string()),
  next_questions: z.array(z.string()),
  private_leader_notes: z.string(),
  leader_feedback: leaderFeedbackSchema,
});

// Formato guardado (e mostrado): cada observação aponta para o id de uma responsabilidade da pessoa,
// ou para nada (`null` = fora das responsabilidades). Não existe mais nome livre.
export const storedAnalysisSchema = analysisOutputSchema.extend({
  development_signals: z.array(
    z.object({
      responsibility_id: z.string().uuid().nullable(),
      observation: z.string().min(1),
      kind: signalKindSchema,
    }),
  ),
});

// Versão que o líder salva na revisão: os combinados já sincronizados ganham o id do registro.
export const reviewedAnalysisSchema = storedAnalysisSchema.extend({
  // Opcional: análises antigas, feitas antes deste campo, não têm feedback.
  leader_feedback: leaderFeedbackSchema.optional(),
  // Na revisão o trecho pode ficar vazio (combinado criado à mão); quem exige trecho é a IA.
  agreements: z.array(
    agreementSchema.extend({ id: z.string().uuid().optional(), evidence_excerpt: z.string() }),
  ),
});

export type LeaderFeedback = z.infer<typeof leaderFeedbackSchema>;
export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
export type StoredAnalysis = z.infer<typeof storedAnalysisSchema>;
export type ReviewedAnalysis = z.infer<typeof reviewedAnalysisSchema>;
