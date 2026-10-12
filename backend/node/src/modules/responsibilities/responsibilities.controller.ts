import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type {
  listResponsibilitiesRequestSchema,
  updateResponsibilityRequestSchema,
} from './responsibilities.schemas.js';
import type { ResponsibilitiesService } from './responsibilities.service.js';

export const makeResponsibilitiesController = (service: ResponsibilitiesService) => ({
  async list(_req: Request, res: Response) {
    const { params, query } = readValidated<z.infer<typeof listResponsibilitiesRequestSchema>>(res);
    res.json(
      await service.list(getCurrentUser(), params.id, { includeRetired: query.retired === 'true' }),
    );
  },

  async updateTitle(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateResponsibilityRequestSchema>>(res);
    res.json(await service.updateTitle(getCurrentUser(), params.id, body.title));
  },
});
