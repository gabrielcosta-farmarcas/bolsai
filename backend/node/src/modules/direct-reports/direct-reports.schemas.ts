import { z } from 'zod';
import { responsibilityListSchema } from '../responsibilities/responsibilities.schemas.js';

const MAX_TEXT_LENGTH = 120;
const MAX_PAGE_SIZE = 100;
const MAX_MAP_SECTION = 50_000;

const emptyObject = z.object({}).strict();

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const text = z.string().trim().min(1).max(MAX_TEXT_LENGTH);

export const directReportStatusSchema = z.enum(['active', 'inactive']);
export type DirectReportStatus = z.infer<typeof directReportStatusSchema>;

export const createDirectReportSchema = z
  .object({
    name: text,
    role: text,
    startedAt: calendarDate,
    status: directReportStatusSchema.optional(),
    // Responsograma inicial: a missão é opcional; as responsabilidades (de 3 a 10) são obrigatórias.
    // As regras com mensagem em português ficam em checkResponsibilities (service).
    mission: z.string().max(MAX_MAP_SECTION).optional(),
    responsibilities: responsibilityListSchema,
  })
  .strict();
export type CreateDirectReportInput = z.infer<typeof createDirectReportSchema>;

export const updateDirectReportSchema = z
  .object({
    name: text,
    role: text,
    startedAt: calendarDate,
    status: directReportStatusSchema,
  })
  .partial()
  .strict()
  .refine((input) => Object.keys(input).length > 0, { message: 'Informe ao menos um campo' });
export type UpdateDirectReportInput = z.infer<typeof updateDirectReportSchema>;

export const idParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const listDirectReportsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(20),
    status: directReportStatusSchema.optional(),
  })
  .strict();

export const listDirectReportsRequestSchema = z.object({
  body: emptyObject.default({}),
  params: emptyObject.default({}),
  query: listDirectReportsQuerySchema,
});

export const createDirectReportRequestSchema = z.object({
  body: createDirectReportSchema,
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});

export const idRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParamsSchema,
  query: emptyObject.default({}),
});

export const updateDirectReportRequestSchema = z.object({
  body: updateDirectReportSchema,
  params: idParamsSchema,
  query: emptyObject.default({}),
});
