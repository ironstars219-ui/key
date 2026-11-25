import { badRequest } from './AppError.js';

// page, pageSize из строки запроса: по умолчанию 1 и 20, максимум 100
export function readPaging(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const pageSize = query.pageSize === undefined ? 20 : Number(query.pageSize);
  if (!Number.isInteger(page) || page < 1) throw badRequest('page должен быть целым числом от 1');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw badRequest('pageSize должен быть целым числом от 1 до 100');
  }
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
