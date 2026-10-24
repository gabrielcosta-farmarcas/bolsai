import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type { reportIdRequestSchema } from './preparations.schemas.js';
import type { PreparationsService } from './preparations.service.js';

export const makePreparationsController = (service: PreparationsService) => ({
  async start(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof reportIdRequestSchema>>(res);
    res.status(202).json(await service.start(getCurrentUser(), params.id));
  },

  // Sem roteiro ainda: 200 com `null`, para a tela mostrar o convite em vez de um erro.
  async getLatest(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof reportIdRequestSchema>>(res);
    res.json(await service.getLatest(getCurrentUser(), params.id));
  },
});
