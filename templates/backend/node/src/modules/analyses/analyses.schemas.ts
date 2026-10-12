import { z } from 'zod';

const emptyObject = z.object({}).strict();
const idParams = z.object({ id: z.string().uuid() }).strict();

export const startAnalysisRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParams,
  query: emptyObject.default({}),
});

export const idRequestSchema = z.object({
  body: emptyObject.default({}),
  params: idParams,
  query: emptyObject.default({}),
});

export const noParamsRequestSchema = z.object({
  body: emptyObject.default({}),
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});

export const saveReviewRequestSchema = z.object({
  body: z.object({ analysisId: z.string().uuid(), reviewedJson: z.unknown() }).strict(),
  params: idParams,
  query: emptyObject.default({}),
});
