import { z } from 'zod';

const MAX_PAGE_SIZE = 100;
const MAX_TEXT = 2000;

const emptyObject = z.object({}).strict();
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const idParams = z.object({ id: z.string().uuid() }).strict();

export const ownerSchema = z.enum(['leader', 'report']);
export const statusSchema = z.enum(['open', 'done', 'cancelled']);
// "overdue" é um filtro (aberto com prazo vencido), não um status guardado.
export const statusFilterSchema = z.enum(['open', 'done', 'cancelled', 'overdue']);

export type AgreementOwner = z.infer<typeof ownerSchema>;
export type AgreementStatus = z.infer<typeof statusSchema>;
export type AgreementStatusFilter = z.infer<typeof statusFilterSchema>;

export const listAgreementsRequestSchema = z.object({
  body: emptyObject.default({}),
  params: emptyObject.default({}),
  query: z
    .object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(50),
      status: statusFilterSchema.optional(),
      directReportId: z.string().uuid().optional(),
    })
    .strict(),
});

export const idRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParams,
  query: emptyObject.default({}),
});

export const createAgreementRequestSchema = z.object({
  body: z
    .object({
      description: z.string().trim().min(1).max(MAX_TEXT),
      owner: ownerSchema,
      dueDate: calendarDate.nullable().optional(),
      sessionId: z.string().uuid().optional(),
    })
    .strict(),
  params: idParams,
  query: emptyObject.default({}),
});

export const updateAgreementRequestSchema = z.object({
  body: z
    .object({
      description: z.string().trim().min(1).max(MAX_TEXT),
      owner: ownerSchema,
      dueDate: calendarDate.nullable(),
      status: statusSchema,
    })
    .partial()
    .strict()
    .refine((input) => Object.keys(input).length > 0, { message: 'Informe ao menos um campo' }),
  params: idParams,
  query: emptyObject.default({}),
});
