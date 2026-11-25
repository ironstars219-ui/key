import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Такого адреса нет' } });
}

// единый формат ошибок: {"error":{"code","message"}}
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Тело запроса не является корректным JSON' } });
  }
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Такая запись уже есть' } });
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } });
}
