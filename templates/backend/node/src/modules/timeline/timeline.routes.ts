import { Router } from 'express';
import { z } from 'zod';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import { directReportsRepository } from '../direct-reports/direct-reports.repository.js';
import { timelineRepository } from './timeline.repository.js';
import { makeTimelineService } from './timeline.service.js';

const emptyObject = z.object({}).strict();
const requestSchema = z.object({
  body: emptyObject.default({}),
  params: z.object({ id: z.string().uuid() }).strict(),
  query: emptyObject.default({}),
});

export const timelineRouter = () => {
  const service = makeTimelineService({
    repo: timelineRepository,
    reports: directReportsRepository,
  });
  const router = Router();

  router.get('/direct-reports/:id/timeline', validate(requestSchema), async (_req, res) => {
    const { params } = readValidated<z.infer<typeof requestSchema>>(res);
    res.json(await service.get(getCurrentUser(), params.id));
  });

  return router;
};
