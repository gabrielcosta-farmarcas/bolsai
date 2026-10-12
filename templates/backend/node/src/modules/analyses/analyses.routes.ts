import { Router } from 'express';
import { env } from '../../config/env.js';
import { validate } from '../../shared/middlewares/validate.js';
import { agreementsRepository } from '../agreements/agreements.repository.js';
import { responsibilitiesRepository } from '../responsibilities/responsibilities.repository.js';
import { responsibilityMapsRepository } from '../responsibility-maps/responsibility-maps.repository.js';
import { getAiClientFor, settingsService } from '../settings/settings.instance.js';
import { sessionsRepository } from '../sessions/sessions.repository.js';
import { makeAnalysesController } from './analyses.controller.js';
import { analysesRepository } from './analyses.repository.js';
import {
  idRequestSchema,
  saveReviewRequestSchema,
  startAnalysisRequestSchema,
} from './analyses.schemas.js';
import { makeAnalysesService } from './analyses.service.js';

export const makeDefaultAnalysesService = (
  overrides: Partial<Parameters<typeof makeAnalysesService>[0]> = {},
) =>
  makeAnalysesService({
    repo: analysesRepository,
    sessions: sessionsRepository,
    maps: responsibilityMapsRepository,
    responsibilities: responsibilitiesRepository,
    agreements: { listOpen: agreementsRepository.listOpen },
    getAiClient: getAiClientFor,
    prompts: { load: (leaderId) => settingsService.resolvePrompt(leaderId) },
    config: { maxTranscriptChars: env.TRANSCRIPT_MAX_CHARS },
    ...overrides,
  });

export const analysesRouter = (service = makeDefaultAnalysesService()) => {
  const controller = makeAnalysesController(service);
  const router = Router();

  router.post('/sessions/:id/analyses', validate(startAnalysisRequestSchema), controller.start);
  router.get('/sessions/:id/analyses', validate(idRequestSchema), controller.listBySession);
  router.get('/analyses/:id', validate(idRequestSchema), controller.getById);
  router.put('/sessions/:id/review', validate(saveReviewRequestSchema), controller.saveReview);

  return router;
};
