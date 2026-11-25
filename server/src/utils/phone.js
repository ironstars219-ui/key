import { badRequest } from './AppError.js';

// BR-03: приводим телефон к виду +7XXXXXXXXXX
// «8 701 123-45-67» -> «+77011234567»
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return '+7' + digits.slice(1);
  }
  throw badRequest('Телефон должен быть в формате +7 XXX XXX-XX-XX', 'INVALID_PHONE');
}
