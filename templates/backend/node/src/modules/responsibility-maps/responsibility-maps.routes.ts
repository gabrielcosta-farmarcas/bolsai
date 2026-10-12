import { Router } from 'express';
import multer from 'multer';
import { extractText, MAX_UPLOAD_BYTES } from '../../shared/files/extract-text.js';
import { validate } from '../../shared/middlewares/validate.js';
import { directReportsRepository } from '../direct-reports/direct-reports.repository.js';
import { responsibilitiesRepository } from '../responsibilities/responsibilities.repository.js';
import { makeTitleSuggester } from '../responsibilities/titles.js';
import { getAiClientFor } from '../settings/settings.instance.js';
import { makeResponsibilityMapsController } from './responsibility-maps.controller.js';
import { responsibilityMapsRepository } from './responsibility-maps.repository.js';
import {
  createMapRequestSchema,
  extractMapRequestSchema,
  listMapsRequestSchema,
  mapRequestSchema,
} from './responsibility-maps.schemas.js';
import { makeResponsibilityMapsService } from './responsibility-maps.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

export const makeDefaultTitleSuggester = () =>
  makeTitleSuggester({ repo: responsibilitiesRepository, getAiClient: getAiClientFor });

export const responsibilityMapsRouter = (titles = makeDefaultTitleSuggester()) => {
  const controller = makeResponsibilityMapsController(
    makeResponsibilityMapsService({
      repo: responsibilityMapsRepository,
      reports: directReportsRepository,
      extract: extractText,
      titles,
    }),
  );
  const router = Router();

  router.post(
    '/direct-reports/:id/responsibility-maps',
    validate(createMapRequestSchema),
    controller.create,
  );
  // Só lê o arquivo e devolve uma proposta para os campos; nada é salvo nem guardado.
  router.post(
    '/responsibility-maps/extract',
    upload.single('file'),
    validate(extractMapRequestSchema),
    controller.extract,
  );
  router.get(
    '/direct-reports/:id/responsibility-maps',
    validate(listMapsRequestSchema),
    controller.list,
  );
  router.get('/responsibility-maps/:id', validate(mapRequestSchema), controller.getById);

  return router;
};
