export type ApiErrorBody = {
  error: { code: string; message: string; details: unknown[] };
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const isErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' && value !== null && 'error' in value;

// Avisado quando o servidor diz que a sessão acabou (401), para a tela voltar ao login.
let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

// O servidor só aceita escritas que trazem este cabeçalho (proteção contra pedidos forjados por outros sites).
export const CSRF_HEADERS = { 'X-Requested-With': 'bonsai' } as const;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(init?.headers);
    headers.set('X-Requested-With', CSRF_HEADERS['X-Requested-With']);
    response = await fetch(path, { ...init, headers, credentials: 'same-origin' });
  } catch {
    throw new ApiError('Não foi possível falar com o servidor.', 'NETWORK_ERROR', 0);
  }

  if (response.status === 204) return undefined as T;
  if (response.status === 401) unauthorizedHandler?.();

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (isErrorBody(body)) {
      throw new ApiError(body.error.message, body.error.code, response.status);
    }
    throw new ApiError('Algo deu errado. Tente de novo.', 'UNKNOWN', response.status);
  }
  return body as T;
}
