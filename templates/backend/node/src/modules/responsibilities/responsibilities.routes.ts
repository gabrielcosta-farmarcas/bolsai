import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { directReportsRepository } from '../direct-reports/direct-reports.repository.js';
import { makeResponsibilitiesController } from './responsibilities.controller.js';
import { responsibilitiesRepository } from './responsibilities.repository.js';
import {
  listResponsibilitiesRequestSchema,
  updateResponsibilityRequestSchema,
} from './responsibilities.schemas.js';
import { makeResponsibilitiesService } from './responsibilities.service.js';

export const responsibilitiesRouter = () => {
  const controller = makeResponsibilitiesController(
    makeResponsibilitiesService({
      repo: responsibilitiesRepository,
      reports: directReportsRepository,
    }),
  );
  const router = Router();

  router.get(
    '/direct-reports/:id/responsibilities',
    validate(listResponsibilitiesRequestSchema),
    controller.list,
  );
  router.patch(
    '/responsibilities/:id',
    validate(updateResponsibilityRequestSchema),
    controller.updateTitle,
  );

  return router;
};
