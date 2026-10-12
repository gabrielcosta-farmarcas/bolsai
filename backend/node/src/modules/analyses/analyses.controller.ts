import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type {
  idRequestSchema,
  saveReviewRequestSchema,
  startAnalysisRequestSchema,
} from './analyses.schemas.js';
import type { AnalysesService } from './analyses.service.js';

export const makeAnalysesController = (service: AnalysesService) => ({
  async start(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof startAnalysisRequestSchema>>(res);
    res.status(202).json(await service.start(getCurrentUser(), params.id));
  },

  async listBySession(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.json(await service.listBySession(getCurrentUser(), params.id));
  },

  async getById(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.json(await service.getById(getCurrentUser(), params.id));
  },

  async saveReview(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof saveReviewRequestSchema>>(res);
    res.json(await service.saveReview(getCurrentUser(), params.id, body));
  },
});
