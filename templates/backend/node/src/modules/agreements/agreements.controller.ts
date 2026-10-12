import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type {
  createAgreementRequestSchema,
  idRequestSchema,
  listAgreementsRequestSchema,
  updateAgreementRequestSchema,
} from './agreements.schemas.js';
import type { AgreementsService } from './agreements.service.js';

export const makeAgreementsController = (service: AgreementsService) => ({
  async list(_req: Request, res: Response) {
    const { query } = readValidated<z.infer<typeof listAgreementsRequestSchema>>(res);
    res.json(await service.list(getCurrentUser(), query));
  },

  async listByReport(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.json(await service.listByReport(getCurrentUser(), params.id));
  },

  async listBySession(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.json(await service.listBySession(getCurrentUser(), params.id));
  },

  async create(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof createAgreementRequestSchema>>(res);
    res.status(201).json(await service.create(getCurrentUser(), params.id, body));
  },

  async update(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateAgreementRequestSchema>>(res);
    res.json(await service.update(getCurrentUser(), params.id, body));
  },
});
