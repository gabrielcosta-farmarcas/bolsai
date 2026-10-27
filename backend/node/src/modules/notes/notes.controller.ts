import type { Request, Response } from 'express';
import type { z } from 'zod';
import { readValidated } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import type {
  addAgreementRequestSchema,
  createNoteRequestSchema,
  listNotesRequestSchema,
  noteRequestSchema,
  reportRequestSchema,
  updateNoteRequestSchema,
} from './notes.schemas.js';
import type { NotesService } from './notes.service.js';

export const makeNotesController = (service: NotesService) => ({
  async list(_req: Request, res: Response) {
    const { params, query } = readValidated<z.infer<typeof listNotesRequestSchema>>(res);
    res.json(await service.list(getCurrentUser(), params.id, query));
  },

  async listForNextSession(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof reportRequestSchema>>(res);
    res.json(await service.listForNextSession(getCurrentUser(), params.id));
  },

  async create(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof createNoteRequestSchema>>(res);
    res.status(201).json(await service.create(getCurrentUser(), params.id, body));
  },

  async update(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof updateNoteRequestSchema>>(res);
    res.json(await service.update(getCurrentUser(), params.id, body));
  },

  async remove(_req: Request, res: Response) {
    const { params } = readValidated<z.infer<typeof noteRequestSchema>>(res);
    await service.remove(getCurrentUser(), params.id);
    res.status(204).end();
  },

  async addAgreement(_req: Request, res: Response) {
    const { params, body } = readValidated<z.infer<typeof addAgreementRequestSchema>>(res);
    res.status(201).json(await service.addAgreement(getCurrentUser(), params.id, body));
  },
});
