import type { Request, Response } from 'express';
import type { z } from 'zod';
import { ValidationError } from '../../shared/errors/validation-error.js';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type {
  createSessionRequestSchema,
  listSessionsRequestSchema,
  updateSessionRequestSchema,
} from './sessions.schemas.js';
import type { SessionsService } from './sessions.service.js';

// O multer lê o nome do arquivo como latin1; devolve para UTF-8 (acentos).
const fixFileName = (name: string) => Buffer.from(name, 'latin1').toString('utf8');

export const makeSessionsController = (service: SessionsService) => ({
  async create(req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof createSessionRequestSchema>>(res);
    const user = getCurrentUser();

    if (req.file) {
      const created = await service.create(user, params.id, {
        kind: 'file',
        heldOn: body.heldOn,
        fileName: fixFileName(req.file.originalname),
        buffer: req.file.buffer,
      });
      res.status(201).json(created);
      return;
    }

    if (body.transcript === undefined) {
      throw new ValidationError('Envie um arquivo ou cole a transcrição.');
    }
    const created = await service.create(user, params.id, {
      kind: 'text',
      heldOn: body.heldOn,
      transcript: body.transcript,
    });
    res.status(201).json(created);
  },

  async listByReport(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof listSessionsRequestSchema>>(res);
    res.json(await service.listByReport(getCurrentUser(), params.id));
  },

  async getById(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof listSessionsRequestSchema>>(res);
    res.json(await service.getById(getCurrentUser(), params.id));
  },

  async update(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateSessionRequestSchema>>(res);
    res.json(await service.update(getCurrentUser(), params.id, body));
  },
});
