import { prisma } from '../database/prisma.js';
import { badRequest } from '../utils/AppError.js';
import { isValidDateString, startOfLocalDay, startOfNextLocalDay, todayInWorkshop } from '../utils/dates.js';

const STATUSES = ['NEW', 'IN_PROGRESS', 'READY', 'ISSUED', 'CANCELLED'];

// from/to — «ГГГГ-ММ-ДД» включительно, по местному календарю (BR-21).
// Если не указаны, берётся текущий месяц по сегодняшнюю дату.
export async function overview({ from, to }) {
  const today = todayInWorkshop();
  from = from ?? today.slice(0, 8) + '01';
  to = to ?? today;
  if (!isValidDateString(from) || !isValidDateString(to)) throw badRequest('from и to: формат ГГГГ-ММ-ДД');
  if (from > to) throw badRequest('Дата «с» позже даты «по»');

  const range = { gte: startOfLocalDay(from), lt: startOfNextLocalDay(to) };

  const [ordersCreated, groups, paid] = await Promise.all([
    prisma.order.count({ where: { createdAt: range } }),
    prisma.order.groupBy({ by: ['status'], where: { createdAt: range }, _count: { _all: true } }),
    // BR-20: считаем заказы, которые сейчас PAID и оплачены в периоде
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', paidAt: range },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const g of groups) byStatus[g.status] = g._count._all;

  return {
    period: { from, to, timezone: 'Asia/Almaty' },
    ordersCreated,
    paidOrders: paid._count._all,
    revenuePaid: paid._sum.totalAmount ?? 0,
    byStatus,
  };
}
