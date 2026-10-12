import { ApiError, apiFetch, setUnauthorizedHandler } from './api';

const mockFetch = (response: Partial<Response> | Error) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      if (response instanceof Error) throw response;
      return response;
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe('apiFetch', () => {
  it('deve devolver o JSON quando a resposta é ok', async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ status: 'ok' }) });
    await expect(apiFetch('/health')).resolves.toEqual({ status: 'ok' });
  });

  it('deve transformar o erro da API em ApiError', async () => {
    mockFetch({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: 'NOT_FOUND', message: 'Não achei', details: [] } }),
    });
    await expect(apiFetch('/x')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('deve avisar quando o servidor não responde', async () => {
    mockFetch(new Error('offline'));
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('deve enviar o cabeçalho de proteção e manter o cookie só no mesmo site, sem apagar outros cabeçalhos', async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({}) });

    await apiFetch('/x', { method: 'POST', headers: { 'Content-Type': 'application/json' } });

    const [, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);
    expect(headers.get('X-Requested-With')).toBe('bonsai');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(init?.credentials).toBe('same-origin');
  });

  it('deve avisar a tela quando a sessão acabou (401)', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockFetch({
      ok: false,
      status: 401,
      json: async () => ({ error: { code: 'UNAUTHENTICATED', message: 'Entre', details: [] } }),
    });

    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledOnce();
  });
});
