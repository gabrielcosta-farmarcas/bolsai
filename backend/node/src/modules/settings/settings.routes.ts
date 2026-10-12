import { Router } from 'express';
import type { z } from 'zod';
import { readValidated, validate } from '../../shared/middlewares/validate.js';
import { getCurrentUser } from '../../shared/security/current-user.js';
import {
  getSettingsRequestSchema,
  setApiKeyRequestSchema,
  setModelRequestSchema,
  setPromptRequestSchema,
} from './settings.schemas.js';
import type { SettingsService } from './settings.service.js';
import { settingsService } from './settings.instance.js';

export const settingsRouter = (service: SettingsService = settingsService) => {
  const router = Router();

  router.get('/settings', validate(getSettingsRequestSchema), async (_req, res) => {
    res.json(await service.get(getCurrentUser()));
  });

  router.put('/settings/api-key', validate(setApiKeyRequestSchema), async (_req, res) => {
    const { body } = readValidated<z.infer<typeof setApiKeyRequestSchema>>(res);
    await service.setApiKey(getCurrentUser(), body.apiKey);
    res.json(await service.get(getCurrentUser()));
  });

  router.delete('/settings/api-key', validate(getSettingsRequestSchema), async (_req, res) => {
    await service.clearApiKey(getCurrentUser());
    res.json(await service.get(getCurrentUser()));
  });

  router.put('/settings/model', validate(setModelRequestSchema), async (_req, res) => {
    const { body } = readValidated<z.infer<typeof setModelRequestSchema>>(res);
    await service.setModel(getCurrentUser(), body.model);
    res.json(await service.get(getCurrentUser()));
  });

  router.put('/settings/prompt', validate(setPromptRequestSchema), async (_req, res) => {
    const { body } = readValidated<z.infer<typeof setPromptRequestSchema>>(res);
    await service.setPrompt(getCurrentUser(), body.text);
    res.json(await service.get(getCurrentUser()));
  });

  router.delete('/settings/prompt', validate(getSettingsRequestSchema), async (_req, res) => {
    await service.resetPrompt(getCurrentUser());
    res.json(await service.get(getCurrentUser()));
  });

  return router;
};
