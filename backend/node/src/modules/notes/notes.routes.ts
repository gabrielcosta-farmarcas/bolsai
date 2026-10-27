import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { directReportsRepository } from '../direct-reports/direct-reports.repository.js';
import { makeNotesController } from './notes.controller.js';
import { notesRepository } from './notes.repository.js';
import {
  addAgreementRequestSchema,
  createNoteRequestSchema,
  listNotesRequestSchema,
  noteRequestSchema,
  reportRequestSchema,
  updateNoteRequestSchema,
} from './notes.schemas.js';
import { makeNotesService } from './notes.service.js';

export const makeDefaultNotesService = () =>
  makeNotesService({ repo: notesRepository, reports: directReportsRepository });

export const notesRouter = (service = makeDefaultNotesService()) => {
  const controller = makeNotesController(service);
  const router = Router();

  router.get('/direct-reports/:id/notes', validate(listNotesRequestSchema), controller.list);
  router.get(
    '/direct-reports/:id/notes/for-next-session',
    validate(reportRequestSchema),
    controller.listForNextSession,
  );
  router.post('/direct-reports/:id/notes', validate(createNoteRequestSchema), controller.create);
  router.patch('/notes/:id', validate(updateNoteRequestSchema), controller.update);
  router.delete('/notes/:id', validate(noteRequestSchema), controller.remove);
  router.post(
    '/notes/:id/agreements',
    validate(addAgreementRequestSchema),
    controller.addAgreement,
  );

  return router;
};
