import { Router } from 'express';
import { z } from 'zod';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import { exportsRepository } from './exports.repository.js';
import { makeExportsService } from './exports.service.js';

const emptyObject = z.object({}).strict();
const requestSchema = z.object({
  body: emptyObject.default({}),
  params: z.object({ id: z.string().uuid() }).strict(),
  query: emptyObject.default({}),
});

export const exportsRouter = () => {
  const service = makeExportsService({ repo: exportsRepository });
  const router = Router();

  // POST porque registra a data da exportação (summary_exported_at).
  router.post('/sessions/:id/summary', validate(requestSchema), async (_req, res) => {
    const { params } = readValidated<z.infer<typeof requestSchema>>(res);
    res.json(await service.summary(getCurrentUser(), params.id));
  });

  return router;
};
