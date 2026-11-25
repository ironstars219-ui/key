import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/AppError.js';

// хеш для сравнения, когда логина нет: время ответа не выдаёт, что логин неверный
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

export const publicUser = (u) => ({ id: u.id, fullName: u.fullName, login: u.login, role: u.role });

export async function login({ login, password }) {
  const user = await prisma.user.findUnique({ where: { login } });
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  // одно и то же сообщение для неверного логина, пароля и отключённого сотрудника
  if (!user || !ok || !user.isActive) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Неверный логин или пароль');
  }
  const token = jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  const { exp, iat } = jwt.decode(token);
  return { token, tokenType: 'Bearer', expiresIn: exp - iat, user: publicUser(user) };
}
