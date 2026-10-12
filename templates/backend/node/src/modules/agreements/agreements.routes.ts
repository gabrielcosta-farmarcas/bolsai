import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { directReportsRepository } from '../direct-reports/direct-reports.repository.js';
import { sessionsRepository } from '../sessions/sessions.repository.js';
import { makeAgreementsController } from './agreements.controller.js';
import { agreementsRepository } from './agreements.repository.js';
import {
  createAgreementRequestSchema,
  idRequestSchema,
  listAgreementsRequestSchema,
  updateAgreementRequestSchema,
} from './agreements.schemas.js';
import { makeAgreementsService } from './agreements.service.js';

export const makeDefaultAgreementsService = () =>
  makeAgreementsService({
    repo: agreementsRepository,
    reports: directReportsRepository,
    sessions: sessionsRepository,
  });

export const agreementsRouter = (service = makeDefaultAgreementsService()) => {
  const controller = makeAgreementsController(service);
  const router = Router();

  router.get('/agreements', validate(listAgreementsRequestSchema), controller.list);
  router.patch('/agreements/:id', validate(updateAgreementRequestSchema), controller.update);
  router.get('/direct-reports/:id/agreements', validate(idRequestSchema), controller.listByReport);
  router.post(
    '/direct-reports/:id/agreements',
    validate(createAgreementRequestSchema),
    controller.create,
  );
  router.get('/sessions/:id/agreements', validate(idRequestSchema), controller.listBySession);

  return router;
};
