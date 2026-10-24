import { Router } from 'express';
import { loadPrompt } from '../../shared/ai/prompt-loader.js';
import { validate } from '../../shared/middlewares/validate.js';
import { agreementsRepository } from '../agreements/agreements.repository.js';
import { responsibilitiesRepository } from '../responsibilities/responsibilities.repository.js';
import { directReportsRepository } from '../direct-reports/direct-reports.repository.js';
import { responsibilityMapsRepository } from '../responsibility-maps/responsibility-maps.repository.js';
import { getAiClientFor } from '../settings/settings.instance.js';
import { makePreparationsController } from './preparations.controller.js';
import { preparationsRepository } from './preparations.repository.js';
import { reportIdRequestSchema } from './preparations.schemas.js';
import { makePreparationsService } from './preparations.service.js';

export const PREPARATION_PROMPT_NAME = 'preparation';

export const makeDefaultPreparationsService = (
  overrides: Partial<Parameters<typeof makePreparationsService>[0]> = {},
) =>
  makePreparationsService({
    repo: preparationsRepository,
    reports: directReportsRepository,
    maps: responsibilityMapsRepository,
    responsibilities: responsibilitiesRepository,
    agreements: { listByReport: agreementsRepository.listByReport },
    getAiClient: getAiClientFor,
    prompts: { load: () => loadPrompt(PREPARATION_PROMPT_NAME) },
    ...overrides,
  });

export const preparationsRouter = (service = makeDefaultPreparationsService()) => {
  const controller = makePreparationsController(service);
  const router = Router();

  router.post(
    '/direct-reports/:id/preparations',
    validate(reportIdRequestSchema),
    controller.start,
  );
  router.get(
    '/direct-reports/:id/preparations/latest',
    validate(reportIdRequestSchema),
    controller.getLatest,
  );

  return router;
};
