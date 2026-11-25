import bcrypt from 'bcryptjs';
import { prisma } from '../database/prisma.js';
import { conflict, notFound } from '../utils/AppError.js';

// passwordHash наружу не отдаём никогда
const SAFE = { id: true, fullName: true, login: true, role: true, isActive: true };

export async function list({ skip, take, page, pageSize }) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({ select: SAFE, orderBy: { id: 'asc' }, skip, take }),
    prisma.user.count(),
  ]);
  return { items, total, page, pageSize };
}

export async function create({ fullName, login, password, role }) {
  const exists = await prisma.user.findUnique({ where: { login } });
  if (exists) throw conflict('LOGIN_TAKEN', 'Такой логин уже занят');
  return prisma.user.create({
    data: { fullName, login, role, passwordHash: await bcrypt.hash(password, 10) },
    select: SAFE,
  });
}

export async function update(id, data, actor) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw notFound('Сотрудник не найден');

  // BR-19: нельзя лишить доступа или прав последнего администратора и самого себя
  const losesAdmin =
    target.role === 'ADMIN' &&
    target.isActive &&
    (data.isActive === false || (data.role !== undefined && data.role !== 'ADMIN'));
  if (losesAdmin) {
    if (target.id === actor.id) {
      throw conflict('CANNOT_DISABLE_SELF', 'Нельзя отключить себя или снять с себя права администратора');
    }
    const others = await prisma.user.count({ where: { role: 'ADMIN', isActive: true, id: { not: id } } });
    if (others === 0) throw conflict('LAST_ADMIN', 'Нельзя отключить последнего администратора');
  }

  const { password, ...rest } = data;
  if (password) rest.passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.update({ where: { id }, data: rest, select: SAFE });
}
