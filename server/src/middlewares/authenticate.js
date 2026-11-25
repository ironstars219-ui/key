import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// BR-01: токен проверяем и каждый раз сверяем с базой, чтобы
// отключённый сотрудник сразу потерял доступ
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Нужно войти в систему');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Вход недействителен, войдите заново');
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, fullName: true, login: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'Доступ закрыт');
  }

  req.user = user;
  next();
});
