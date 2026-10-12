import type { Request, Response } from 'express';
import type { z } from 'zod';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type {
  createMapRequestSchema,
  listMapsRequestSchema,
  mapRequestSchema,
} from './responsibility-maps.schemas.js';
import type { ResponsibilityMapsService } from './responsibility-maps.service.js';

// O multer lê o nome do arquivo como latin1; devolve para UTF-8 (acentos).
const fixFileName = (name: string) => Buffer.from(name, 'latin1').toString('utf8');

export const makeResponsibilityMapsController = (service: ResponsibilityMapsService) => ({
  async create(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof createMapRequestSchema>>(res);
    res.status(201).json(
      await service.createVersion(getCurrentUser(), params.id, {
        mission: body.mission,
        responsibilities: body.responsibilities,
      }),
    );
  },

  async extract(req: Request, res: Response) {
    if (!req.file) throw new ValidationError('Envie um arquivo PDF, DOCX ou TXT.');
    res.json(
      await service.extractProposal({
        fileName: fixFileName(req.file.originalname),
        buffer: req.file.buffer,
      }),
    );
  },

  async list(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof listMapsRequestSchema>>(res);
    res.json(await service.list(getCurrentUser(), params.id));
  },

  async getById(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof mapRequestSchema>>(res);
    res.json(await service.getById(getCurrentUser(), params.id));
  },
});
