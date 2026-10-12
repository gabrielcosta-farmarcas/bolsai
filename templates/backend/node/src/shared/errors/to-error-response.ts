import { ZodError } from 'zod';
import { AppError } from './app-error.js';

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
};

export type ErrorResponse = {
  statusCode: number;
  body: ErrorBody;
  level: 'warn' | 'error';
};

const internalError = (): ErrorResponse => ({
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

const isUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof Error) || !('code' in error)) return false;
  return error.code === 'P2002';
};

const isRecordNotFound = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'P2025';

const isMulterError = (error: unknown): error is Error & { code: string } =>
  error instanceof Error && error.name === 'MulterError' && 'code' in error;

export const toErrorResponse = (error: unknown): ErrorResponse => {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      level: error.statusCode >= 500 ? 'error' : 'warn',
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      level: 'warn',
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error.issues.map((issue) => ({
            path: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        },
      },
    };
  }

  if (isMulterError(error)) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    return {
      statusCode: tooLarge ? 413 : 400,
      level: 'warn',
      body: {
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
          message: tooLarge
            ? 'O arquivo passa do limite de 10 MB.'
            : 'Não foi possível receber o arquivo.',
          details: [],
        },
      },
    };
  }

  // Prisma não achou o registro (por exemplo, é de outra líder): responde como "não encontrado".
  if (isRecordNotFound(error)) {
    return {
      statusCode: 404,
      level: 'warn',
      body: { error: { code: 'NOT_FOUND', message: 'Registro não encontrado', details: [] } },
    };
  }

  if (isUniqueViolation(error)) {
    return {
      statusCode: 409,
      level: 'warn',
      body: {
        error: {
          code: 'CONFLICT',
          message: 'Registro duplicado',
          details: [],
        },
      },
    };
  }

  return internalError();
};
