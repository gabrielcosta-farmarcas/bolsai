import { afterEach, describe, expect, it, vi } from 'vitest';

// O app lê TRUST_PROXY ao carregar, então cada caso importa o módulo de novo com o valor desejado.
const loadApp = async (trustProxy?: string) => {
  vi.resetModules();
  if (trustProxy !== undefined) vi.stubEnv('TRUST_PROXY', trustProxy);
  const { createApp } = await import('./app.js');
  return createApp();
};

describe('trust proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fica desligado por padrão (ambiente local, sem proxy na frente)', async () => {
    expect((await loadApp()).get('trust proxy')).toBeFalsy();
  });

  it('confia nos N proxies configurados (hospedagem: proxy do Coolify + nginx)', async () => {
    expect((await loadApp('2')).get('trust proxy')).toBe(2);
  });

  it('recusa valor inválido', async () => {
    await expect(loadApp('muitos')).rejects.toThrow();
  });
});
