import { AppError } from './app-error.js';

// 403: a pessoa entrou, mas o papel dela não permite esta ação.
export class ForbiddenError extends AppError {
  constructor(message = 'Você não tem permissão para isso.', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}
