import { z } from 'zod';

const MAX_DESCRIPTION = 2000;
const MAX_STEP_TEXT = 500;

const emptyObject = z.object({}).strict();
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD');
const idParams = z.object({ id: z.string().uuid() }).strict();
const stepParams = z.object({ id: z.string().uuid(), stepId: z.string().uuid() }).strict();

export const noteKindSchema = z.enum(['agreement_missed', 'attention', 'praise']);
export const stepOwnerSchema = z.enum(['leader', 'report']);
export const noteStatusSchema = z.enum(['no_plan', 'in_progress', 'resolved']);

export type NoteKind = z.infer<typeof noteKindSchema>;
export type StepOwner = z.infer<typeof stepOwnerSchema>;
export type NoteStatus = z.infer<typeof noteStatusSchema>;

const description = z.string().trim().min(1).max(MAX_DESCRIPTION);
const stepText = z.string().trim().min(1).max(MAX_STEP_TEXT);

export const reportRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParams,
  query: emptyObject.default({}),
});

export const listNotesRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParams,
  query: z.object({ status: noteStatusSchema.optional() }).strict(),
});

export const noteRequestSchema = reportRequestSchema;

export const createNoteRequestSchema = z.object({
  body: z.object({ kind: noteKindSchema, description, notedAt: calendarDate.optional() }).strict(),
  params: idParams,
  query: emptyObject.default({}),
});

export const updateNoteRequestSchema = z.object({
  body: z
    .object({
      kind: noteKindSchema,
      description,
      notedAt: calendarDate,
      resolved: z.boolean(),
      bringToNextSession: z.boolean(),
    })
    .partial()
    .strict()
    .refine((input) => Object.keys(input).length > 0, { message: 'Informe ao menos um campo' }),
  params: idParams,
  query: emptyObject.default({}),
});

export const addStepRequestSchema = z.object({
  body: z
    .object({
      text: stepText,
      dueDate: calendarDate.nullable().optional(),
      owner: stepOwnerSchema.optional(),
    })
    .strict(),
  params: idParams,
  query: emptyObject.default({}),
});

export const updateStepRequestSchema = z.object({
  body: z
    .object({
      text: stepText,
      dueDate: calendarDate.nullable(),
      owner: stepOwnerSchema,
      done: z.boolean(),
    })
    .partial()
    .strict()
    .refine((input) => Object.keys(input).length > 0, { message: 'Informe ao menos um campo' }),
  params: stepParams,
  query: emptyObject.default({}),
});

export const stepRequestSchema = z.object({
  body: emptyObject.default({}),
  params: stepParams,
  query: emptyObject.default({}),
});
