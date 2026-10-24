import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { prisma } from '../database/prisma.js';
import { resetDatabase } from '../../test/reset-database.js';
import { TEST_ORIGIN } from '../../test/auth.js';

describe('entrada local sem login (LOCAL_AUTH_BYPASS)', () => {
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('deve exigir login por padrão', async () => {
    const app = createApp();
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/direct-reports')).status).toBe(401);
  });

  it('deve entrar como a líder fixa, sem cookie, quando ligado', async () => {
    await resetDatabase();
    const app = createApp({ authBypass: true });

    const me = await request(app).get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.roles).toEqual(['lider']);

    const created = await request(app)
      .post('/api/v1/direct-reports')
      .set('X-Requested-With', 'bonsai')
      .set('Origin', TEST_ORIGIN)
      .send({
        name: 'Marina',
        role: 'Designer',
        startedAt: '2025-01-20',
        responsibilities: [
          'Atender os clientes pelos canais.',
          'Registrar demandas no CRM.',
          'Acompanhar soluções.',
        ],
      });
    expect(created.status).toBe(201);
    expect((await request(app).get('/api/v1/direct-reports')).status).toBe(200);
  });

  it('deve manter a proteção contra pedidos forjados mesmo ligado', async () => {
    const app = createApp({ authBypass: true });
    const response = await request(app).post('/api/v1/direct-reports').send({});
    expect(response.status).toBe(403);
  });
});
