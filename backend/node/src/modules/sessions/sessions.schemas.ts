import { z } from 'zod';

const emptyObject = z.object({}).strict();
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const MAX_TRANSCRIPT_FIELD = 2_000_000;

export const idParamsSchema = z.object({ id: z.string().uuid() }).strict();

// Multipart traz o arquivo em req.file e heldOn nos campos; JSON traz heldOn e transcript.
export const createSessionBodySchema = z
  .object({ heldOn: calendarDate, transcript: z.string().max(MAX_TRANSCRIPT_FIELD).optional() })
  .strict();

export const createSessionRequestSchema = z.object({
  body: createSessionBodySchema,
  params: idParamsSchema,
  query: emptyObject.default({}),
});

export const listSessionsRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParamsSchema,
  query: emptyObject.default({}),
});

export const sessionRequestSchema = listSessionsRequestSchema;

export const updateSessionRequestSchema = z.object({
  body: z
    .object({ heldOn: calendarDate, transcript: z.string().max(MAX_TRANSCRIPT_FIELD) })
    .partial()
    .strict()
    .refine((input) => Object.keys(input).length > 0, { message: 'Informe ao menos um campo' }),
  params: idParamsSchema,
  query: emptyObject.default({}),
});
