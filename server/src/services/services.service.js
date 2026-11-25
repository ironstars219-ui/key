import { prisma } from '../database/prisma.js';
import { conflict, notFound } from '../utils/AppError.js';

const SHOW = { id: true, name: true, price: true, isActive: true };

export async function list({ includeInactive }) {
  const items = await prisma.service.findMany({
    where: includeInactive ? {} : { isActive: true },
    select: SHOW,
    orderBy: { id: 'asc' },
  });
  return { items };
}

async function ensureNameFree(name, exceptId) {
  const same = await prisma.service.findUnique({ where: { name } });
  if (same && same.id !== exceptId) throw conflict('SERVICE_NAME_TAKEN', 'Услуга с таким названием уже есть');
}

export async function create(data) {
  await ensureNameFree(data.name);
  return prisma.service.create({ data, select: SHOW });
}

// Меняется только каталог: уже созданные заказы хранят свои снимки цен (BR-09)
export async function update(id, data) {
  const exists = await prisma.service.findUnique({ where: { id } });
  if (!exists) throw notFound('Услуга не найдена');
  if (data.name) await ensureNameFree(data.name, id);
  return prisma.service.update({ where: { id }, data, select: SHOW });
}
