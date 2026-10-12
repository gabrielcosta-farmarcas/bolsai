import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ConflictError } from './conflict-error.js';
import { NotFoundError } from './not-found-error.js';
import { toErrorResponse } from './to-error-response.js';

describe('toErrorResponse', () => {
  it('deve responder 404 quando erro é NotFoundError', () => {
    const response = toErrorResponse(new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND'));

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado',
        details: [],
      },
    });
    expect(response.body.error).not.toHaveProperty('stack');
  });

  it('deve responder 409 quando erro é ConflictError', () => {
    const response = toErrorResponse(
      new ConflictError('E-mail já cadastrado', 'EMAIL_ALREADY_EXISTS'),
    );

    expect(response).toMatchObject({
      statusCode: 409,
      body: {
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'E-mail já cadastrado',
          details: [],
        },
      },
    });
  });

  it('deve responder 400 quando erro é ZodError', () => {
    const parsed = z.object({ email: z.string().email() }).safeParse({ email: 'x' });
    if (parsed.success) throw new Error('esperava falha de validação');

    const response = toErrorResponse(parsed.error);

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual([expect.objectContaining({ path: 'email' })]);
  });

  it('deve responder 409 quando Prisma retorna P2002', () => {
    const error = new Error('unique');
    Object.assign(error, { code: 'P2002' });

    const response = toErrorResponse(error);

    expect(response.statusCode).toBe(409);
    expect(response.body.error.code).toBe('CONFLICT');
  });

  it('deve responder 500 genérico quando erro é desconhecido', () => {
    const response = toErrorResponse(new Error('select * from users'));

    expect(response).toEqual({
      statusCode: 500,
      level: 'error',
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          details: [],
        },
      },
    });
  });

  it('deve responder 404 (não 500) quando o Prisma não acha o registro, como o de outra líder', () => {
    const notFound = Object.assign(new Error('No record found'), { code: 'P2025' });

    const response = toErrorResponse(notFound);

    expect(response.statusCode).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
