import { badRequest } from '../utils/AppError.js';
import { readBody, str } from './common.js';

const ROLES = ['ADMIN', 'EMPLOYEE'];

function role(v) {
  if (!ROLES.includes(v)) throw badRequest('role: допустимо ADMIN или EMPLOYEE');
  return v;
}

function password(v) {
  const p = str(v, 'password', { min: 8, max: 100 });
  return p;
}

export function createUserInput(body) {
  const b = readBody(body, ['fullName', 'login', 'password', 'role']);
  return {
    fullName: str(b.fullName, 'fullName', { max: 120 }),
    login: str(b.login, 'login', { min: 3, max: 50 }),
    password: password(b.password),
    role: role(b.role),
  };
}

export function updateUserInput(body) {
  const b = readBody(body, ['fullName', 'password', 'role', 'isActive']);
  const data = {};
  if (b.fullName !== undefined) data.fullName = str(b.fullName, 'fullName', { max: 120 });
  if (b.password !== undefined) data.password = password(b.password);
  if (b.role !== undefined) data.role = role(b.role);
  if (b.isActive !== undefined) {
    if (typeof b.isActive !== 'boolean') throw badRequest('isActive должен быть true или false');
    data.isActive = b.isActive;
  }
  if (!Object.keys(data).length) throw badRequest('Нет полей для изменения');
  return data;
}
