// Ошибка с HTTP-статусом и кодом: её errorHandler превращает в
// {"error":{"code":"...","message":"..."}}
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message, code = 'VALIDATION_ERROR') => new AppError(400, code, message);
export const forbidden = (message = 'Недостаточно прав') => new AppError(403, 'FORBIDDEN', message);
export const notFound = (message = 'Запись не найдена') => new AppError(404, 'NOT_FOUND', message);
export const conflict = (code, message) => new AppError(409, code, message);
