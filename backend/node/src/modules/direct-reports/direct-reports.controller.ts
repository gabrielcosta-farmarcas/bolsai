import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type {
  createDirectReportRequestSchema,
  idRequestSchema,
  listDirectReportsRequestSchema,
  updateDirectReportRequestSchema,
} from './direct-reports.schemas.js';
import type { DirectReportsService } from './direct-reports.service.js';

export const makeDirectReportsController = (service: DirectReportsService) => ({
  async list(_req: Request, res: Response) {
    const { query } = readValidated<z.infer<typeof listDirectReportsRequestSchema>>(res);
    res.json(await service.list(getCurrentUser(), query));
  },

  async getById(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    res.json(await service.getById(getCurrentUser(), params.id));
  },

  async create(_req: Request, res: Response) {
    const { body } = readValidated<z.infer<typeof createDirectReportRequestSchema>>(res);
    res.status(201).json(await service.create(getCurrentUser(), body));
  },

  async update(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateDirectReportRequestSchema>>(res);
    res.json(await service.update(getCurrentUser(), params.id, body));
  },

  async remove(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof idRequestSchema>>(res);
    await service.remove(getCurrentUser(), params.id);
    res.status(204).send();
  },
});
