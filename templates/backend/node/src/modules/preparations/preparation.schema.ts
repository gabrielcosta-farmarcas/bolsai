import { z } from 'zod';
import { agreementOwnerSchema } from '../analyses/analysis.schema.js';

export const MIN_QUESTIONS = 3;
export const MAX_QUESTIONS = 5;
export const MAX_THEMES = 4;

// Saída que a IA deve produzir (português do Brasil). As quantidades são conferidas no service,
// com uma nova tentativa se vierem fora do limite.
export const preparationOutputSchema = z.object({
  themes: z.array(z.object({ title: z.string().min(1), detail: z.string() })),
  questions: z.array(z.string().min(1)),
});

// Formato guardado e mostrado: o que a IA devolveu mais o que o servidor calcula sem IA
// (combinados em aberto e responsabilidades pouco conversadas).
export const storedPreparationSchema = preparationOutputSchema.extend({
  open_agreements: z.array(
    z.object({
      id: z.string().uuid(),
      description: z.string(),
      owner: agreementOwnerSchema,
      due_date: z.string().nullable(),
      is_overdue: z.boolean(),
    }),
  ),
  map_gaps: z.array(
    z.object({
      responsibility_id: z.string().uuid(),
      title: z.string(),
      // Data do último encontro revisado em que foi tratada; nula = nunca foi conversada.
      last_discussed_on: z.string().nullable(),
    }),
  ),
  has_history: z.boolean(),
});

export type PreparationOutput = z.infer<typeof preparationOutputSchema>;
export type StoredPreparation = z.infer<typeof storedPreparationSchema>;
