import { z } from 'zod';
import { AppError } from '../../shared/errors/app-error.js';
import { MAX_TITLE_LENGTH, normalizeKey } from './normalize.js';

export const MIN_RESPONSIBILITIES = 3;
export const MAX_RESPONSIBILITIES = 10;
export const MIN_RESPONSIBILITY_LENGTH = 3;
export const MAX_RESPONSIBILITY_LENGTH = 1000;

export type CheckedResponsibility = { text: string; key: string };

const invalid = (code: string, message: string) => new AppError(message, 422, code);

// Regras de negócio das responsabilidades: de 3 a 10 textos diferentes, cada um de 3 a 1.000 caracteres.
// Campos vazios são ignorados; repetidos viram um só (o aviso conta quantos foram juntados).
// O número do campo nas mensagens é o da tela ("Responsabilidade 4"), mesmo com campos vazios no meio.
export const checkResponsibilities = (raw: string[]) => {
  const filled = raw
    .map((value, index) => ({ text: value.trim(), field: index + 1 }))
    .filter((entry) => entry.text.length > 0);

  if (filled.length > MAX_RESPONSIBILITIES) {
    throw invalid(
      'TOO_MANY_RESPONSIBILITIES',
      `Use no máximo ${MAX_RESPONSIBILITIES} responsabilidades.`,
    );
  }

  for (const entry of filled) {
    const length = entry.text.length;
    if (length < MIN_RESPONSIBILITY_LENGTH || length > MAX_RESPONSIBILITY_LENGTH) {
      throw invalid(
        'INVALID_RESPONSIBILITY',
        `Responsabilidade ${entry.field}: escreva de ${MIN_RESPONSIBILITY_LENGTH} a ${MAX_RESPONSIBILITY_LENGTH} caracteres.`,
      );
    }
  }

  const seen = new Set<string>();
  const items: CheckedResponsibility[] = [];
  for (const entry of filled) {
    const key = normalizeKey(entry.text);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ text: entry.text.replace(/\s+/g, ' '), key });
  }

  if (items.length < MIN_RESPONSIBILITIES) {
    const missing = MIN_RESPONSIBILITIES - items.length;
    throw invalid(
      'TOO_FEW_RESPONSIBILITIES',
      `Preencha pelo menos ${MIN_RESPONSIBILITIES} responsabilidades. ${missing === 1 ? 'Falta 1' : `Faltam ${missing}`}.`,
    );
  }

  return { items, duplicates: filled.length - items.length };
};

const emptyObject = z.object({}).strict();
const idParams = z.object({ id: z.string().uuid() }).strict();

// Teto só para barrar abuso; as regras de verdade (com mensagem) estão em checkResponsibilities.
export const responsibilityListSchema = z.array(z.string().max(5_000)).max(50);

export const listResponsibilitiesRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParams,
  query: z.object({ retired: z.enum(['true', 'false']).optional() }).strict(),
});

export const updateResponsibilityRequestSchema = z.object({
  body: z.object({ title: z.string().trim().min(1).max(MAX_TITLE_LENGTH) }).strict(),
  params: idParams,
  query: emptyObject.default({}),
});
