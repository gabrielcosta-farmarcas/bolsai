import { z } from 'zod';

const emptyObject = z.object({}).strict();

export const getSettingsRequestSchema = z.object({
  body: emptyObject.default({}),
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});

export const setApiKeyRequestSchema = z.object({
  body: z.object({ apiKey: z.string() }).strict(),
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});

export const setModelRequestSchema = z.object({
  body: z.object({ model: z.string() }).strict(),
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});

export const setPromptRequestSchema = z.object({
  body: z.object({ text: z.string() }).strict(),
  params: emptyObject.default({}),
  query: emptyObject.default({}),
});
