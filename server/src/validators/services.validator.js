import { badRequest } from '../utils/AppError.js';
import { readBody, str, int } from './common.js';

const MAX_PRICE = 10_000_000;

export function createServiceInput(body) {
  const b = readBody(body, ['name', 'price']);
  return { name: str(b.name, 'name', { max: 150 }), price: int(b.price, 'price', { max: MAX_PRICE }) };
}

export function updateServiceInput(body) {
  const b = readBody(body, ['name', 'price', 'isActive']);
  const data = {};
  if (b.name !== undefined) data.name = str(b.name, 'name', { max: 150 });
  if (b.price !== undefined) data.price = int(b.price, 'price', { max: MAX_PRICE });
  if (b.isActive !== undefined) {
    if (typeof b.isActive !== 'boolean') throw badRequest('isActive должен быть true или false');
    data.isActive = b.isActive;
  }
  if (!Object.keys(data).length) throw badRequest('Нет полей для изменения');
  return data;
}
