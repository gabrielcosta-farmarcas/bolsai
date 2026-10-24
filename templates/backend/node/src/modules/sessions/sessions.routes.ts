import { Router } from 'express';
import multer from 'multer';
import { env } from '../../config/env.js';
import { MAX_UPLOAD_BYTES } from '../../shared/files/extract-text.js';
import { parseTranscript } from '../../shared/files/parse-transcript.js';
import { validate } from '../../shared/middlewares/validate.js';
import { directReportsRepository } from '../direct-reports/direct-reports.repository.js';
import { makeSessionsController } from './sessions.controller.js';
import { sessionsRepository } from './sessions.repository.js';
import {
  createSessionRequestSchema,
  listSessionsRequestSchema,
  sessionRequestSchema,
  updateSessionRequestSchema,
} from './sessions.schemas.js';
import { makeSessionsService } from './sessions.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

export const sessionsRouter = () => {
  const controller = makeSessionsController(
    makeSessionsService({
      repo: sessionsRepository,
      reports: directReportsRepository,
      parse: parseTranscript,
      config: { maxTranscriptChars: env.TRANSCRIPT_MAX_CHARS },
    }),
  );
  const router = Router();

  router.post(
    '/direct-reports/:id/sessions',
    upload.single('file'),
    validate(createSessionRequestSchema),
    controller.create,
  );
  router.get(
    '/direct-reports/:id/sessions',
    validate(listSessionsRequestSchema),
    controller.listByReport,
  );
  router.get('/sessions/:id', validate(sessionRequestSchema), controller.getById);
  router.patch('/sessions/:id', validate(updateSessionRequestSchema), controller.update);
  router.delete('/sessions/:id', validate(sessionRequestSchema), controller.remove);

  return router;
};
