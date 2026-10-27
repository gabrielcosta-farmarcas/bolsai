import type { NoteStatus } from './notes.schemas.js';

// A situação não é guardada: sai da marca de resolvida e dos passos, então nunca diverge deles.
export const computeNoteStatus = (note: {
  resolvedAt: Date | null;
  stepCount: number;
}): NoteStatus => {
  if (note.resolvedAt) return 'resolved';
  return note.stepCount > 0 ? 'in_progress' : 'no_plan';
};

// Passo atrasado = não feito e com prazo anterior a hoje (AAAA-MM-DD).
export const isStepOverdue = (
  step: { dueDate: string | null; done: boolean },
  today: string,
): boolean => !step.done && step.dueDate !== null && step.dueDate < today;
