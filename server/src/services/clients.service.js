import { prisma } from '../database/prisma.js';
import { notFound } from '../utils/AppError.js';

const SHOW = { id: true, fullName: true, phone: true };

export async function list({ search, skip, take, page, pageSize }) {
  let where = {};
  if (search) {
    const digits = search.replace(/\D/g, '');
    const or = [{ fullName: { contains: search, mode: 'insensitive' } }];
    // поиск по телефону: берём только цифры, чтобы «701 123» нашло +77011234567
    if (digits) or.push({ phone: { contains: digits } });
    where = { OR: or };
  }
  const [items, total] = await Promise.all([
    prisma.client.findMany({ where, select: SHOW, orderBy: { fullName: 'asc' }, skip, take }),
    prisma.client.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getById(id) {
  const client = await prisma.client.findUnique({ where: { id }, select: SHOW });
  if (!client) throw notFound('Клиент не найден');
  const [ordersCount, latest] = await Promise.all([
    prisma.order.count({ where: { clientId: id } }),
    prisma.order.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, status: true, totalAmount: true },
    }),
  ]);
  return { ...client, ordersCount, latestOrders: latest };
}

export const create = (data) => prisma.client.create({ data, select: SHOW });

export async function update(id, data) {
  const exists = await prisma.client.findUnique({ where: { id } });
  if (!exists) throw notFound('Клиент не найден');
  return prisma.client.update({ where: { id }, data, select: SHOW });
}
