import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { makeDirectReportsController } from './direct-reports.controller.js';
import { makeDefaultTitleSuggester } from '../responsibility-maps/responsibility-maps.routes.js';
import { directReportsRepository } from './direct-reports.repository.js';
import {
  createDirectReportRequestSchema,
  idRequestSchema,
  listDirectReportsRequestSchema,
  updateDirectReportRequestSchema,
} from './direct-reports.schemas.js';
import { makeDirectReportsService } from './direct-reports.service.js';

export const directReportsRouter = (titles = makeDefaultTitleSuggester()) => {
  const controller = makeDirectReportsController(
    makeDirectReportsService(directReportsRepository, titles),
  );
  const router = Router();

  router.get('/', validate(listDirectReportsRequestSchema), controller.list);
  router.post('/', validate(createDirectReportRequestSchema), controller.create);
  router.get('/:id', validate(idRequestSchema), controller.getById);
  router.patch('/:id', validate(updateDirectReportRequestSchema), controller.update);
  router.delete('/:id', validate(idRequestSchema), controller.remove);

  return router;
};
