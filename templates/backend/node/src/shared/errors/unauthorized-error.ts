import { AppError } from './app-error.js';

// 401: ninguém entrou (ou a sessão acabou). A mensagem é sempre a mesma, sem pistas.
export class UnauthorizedError extends AppError {
  constructor(message = 'É preciso entrar para continuar.', code = 'UNAUTHENTICATED') {
    super(message, 401, code);
  }
}
