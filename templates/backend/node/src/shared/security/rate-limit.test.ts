import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../middlewares/error-handler.js';
import { createRateLimiter } from './rate-limit.js';

describe('createRateLimiter', () => {
  it('deve responder 429 no formato de erro padrão depois do limite', async () => {
    const app = express();
    app.use(createRateLimiter({ windowMs: 60_000, limit: 2 }));
    app.get('/', (_req, res) => res.json({ ok: true }));
    app.use(errorHandler);

    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    const blocked = await request(app).get('/');

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});
