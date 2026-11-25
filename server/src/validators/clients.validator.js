import { badRequest } from '../utils/AppError.js';
import { normalizePhone } from '../utils/phone.js';
import { readBody, str } from './common.js';

export function createClientInput(body) {
  const b = readBody(body, ['fullName', 'phone']);
  return { fullName: str(b.fullName, 'fullName', { max: 120 }), phone: normalizePhone(b.phone) };
}

export function updateClientInput(body) {
  const b = readBody(body, ['fullName', 'phone']);
  const data = {};
  if (b.fullName !== undefined) data.fullName = str(b.fullName, 'fullName', { max: 120 });
  if (b.phone !== undefined) data.phone = normalizePhone(b.phone);
  if (!Object.keys(data).length) throw badRequest('Нет полей для изменения');
  return data;
}
