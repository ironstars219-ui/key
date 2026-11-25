import { badRequest } from '../utils/AppError.js';

// тело запроса должно быть объектом и содержать только разрешённые поля
export function readBody(body, allowed) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Тело запроса должно быть JSON-объектом');
  }
  const extra = Object.keys(body).filter((k) => !allowed.includes(k));
  if (extra.length) throw badRequest(`Недопустимые поля: ${extra.join(', ')}`);
  return body;
}

export function str(value, name, { min = 1, max = 200, required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw badRequest(`Поле «${name}» обязательно`);
    return undefined;
  }
  if (typeof value !== 'string') throw badRequest(`Поле «${name}» должно быть строкой`);
  const v = value.trim();
  if (v.length < min) throw badRequest(`Поле «${name}» не может быть пустым`);
  if (v.length > max) throw badRequest(`Поле «${name}» длиннее ${max} символов`);
  return v;
}

export function int(value, name, { min = 0, max = 2147483647 } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw badRequest(`Поле «${name}» должно быть целым числом от ${min} до ${max}`);
  }
  return value;
}

export function idParam(value, name = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 2147483647) throw badRequest(`Некорректный ${name}`);
  return n;
}
