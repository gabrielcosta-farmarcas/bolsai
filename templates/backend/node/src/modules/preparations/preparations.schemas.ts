import { z } from 'zod';

const emptyObject = z.object({}).strict();

// Os dois pedidos usam só o id da pessoa na rota.
export const reportIdRequestSchema = z.object({
  body: emptyObject.default({}),
  params: z.object({ id: z.string().uuid() }).strict(),
  query: emptyObject.default({}),
});
