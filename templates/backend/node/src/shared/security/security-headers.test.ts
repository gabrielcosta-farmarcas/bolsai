import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { securityHeaders } from './security-headers.js';

describe('securityHeaders', () => {
  it('deve enviar os cabeçalhos de proteção', async () => {
    const app = express();
    app.use(securityHeaders());
    app.get('/', (_req, res) => res.json({}));

    const response = await request(app).get('/');

    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(response.headers['content-security-policy']).toContain("default-src 'none'");
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
