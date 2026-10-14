import { z } from 'zod';
import { responsibilityListSchema } from '../responsibilities/responsibilities.schemas.js';

export const MAX_BEHAVIORS_LENGTH = 3000;

const emptyObject = z.object({}).strict();

export const reportIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const mapIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

// A nova versão traz a missão e os comportamentos desejados (opcionais) e a lista de responsabilidades (as regras de 3 a 10 ficam no service).
export const createMapBodySchema = z
  .object({
    mission: z.string().max(50_000).optional(),
    behaviors: z.string().max(MAX_BEHAVIORS_LENGTH).optional(),
    responsibilities: responsibilityListSchema,
  })
  .strict();

export const createMapRequestSchema = z.object({
  body: createMapBodySchema,
  params: reportIdParamsSchema,
  query: emptyObject.default({}),
});

// Ler o arquivo não depende de pessoa nenhuma: só devolve uma proposta para os campos.
export const extractMapRequestSchema = z.object({
  body: emptyObject.default({}),
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});

export const listMapsRequestSchema = z.object({
  body: emptyObject.default({}),
  params: reportIdParamsSchema,
  query: emptyObject.default({}),
});

export const mapRequestSchema = z.object({
  body: emptyObject.default({}),
  params: mapIdParamsSchema,
  query: emptyObject.default({}),
});
