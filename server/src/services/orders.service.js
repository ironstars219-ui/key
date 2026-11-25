import { prisma } from '../database/prisma.js';
import { AppError, badRequest, conflict, forbidden, notFound } from '../utils/AppError.js';
import { dateToString, isOverdue, startOfLocalDay, startOfNextLocalDay, todayInWorkshop } from '../utils/dates.js';

const MAX_INT = 2147483647;

// BR-11: статусы меняются только по этой схеме
const TRANSITIONS = {
  NEW: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['READY', 'CANCELLED'],
  READY: ['ISSUED', 'CANCELLED'],
  ISSUED: [],
  CANCELLED: [],
};

const EDITABLE = ['NEW', 'IN_PROGRESS']; // BR-10

const DETAIL_INCLUDE = {
  client: { select: { id: true, fullName: true, phone: true } },
  createdBy: { select: { id: true, fullName: true } },
  assignee: { select: { id: true, fullName: true } },
  items: { orderBy: { id: 'asc' } },
};

// ---------- ответы API ----------

function formatItem(i) {
  return {
    id: i.id,
    serviceId: i.serviceId,
    serviceNameSnapshot: i.serviceNameSnapshot,
    unitPriceSnapshot: i.unitPriceSnapshot,
    quantity: i.quantity,
    lineTotal: i.unitPriceSnapshot * i.quantity, // в БД не хранится
  };
}

function formatDetail(o) {
  return {
    id: o.id,
    client: o.client,
    createdBy: o.createdBy,
    assignee: o.assignee,
    dueDate: dateToString(o.dueDate),
    isOverdue: isOverdue(o), // отметка «срок прошёл», это не статус
    comment: o.comment,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalAmount: o.totalAmount,
    paidAt: o.paidAt,
    issuedAt: o.issuedAt,
    cancelReason: o.cancelReason,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items.map(formatItem),
  };
}

function formatListItem(o) {
  return {
    id: o.id,
    client: o.client,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalAmount: o.totalAmount,
    dueDate: dateToString(o.dueDate),
    isOverdue: isOverdue(o),
    createdAt: o.createdAt,
  };
}

async function loadDetail(db, id) {
  const order = await db.order.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!order) throw notFound('Заказ не найден');
  return formatDetail(order);
}

// ---------- вспомогательные проверки ----------

async function checkClient(db, clientId) {
  if (clientId === null || clientId === undefined) return;
  const c = await db.client.findUnique({ where: { id: clientId } });
  if (!c) throw notFound('Клиент не найден');
}

async function checkAssignee(db, assigneeId) {
  if (assigneeId === null || assigneeId === undefined) return;
  const u = await db.user.findUnique({ where: { id: assigneeId } });
  if (!u || !u.isActive) throw badRequest('Исполнитель не найден или отключён', 'INVALID_ASSIGNEE');
}

// BR-06, BR-08, BR-09: цену берёт сервер из каталога, только активные услуги
async function buildNewItems(db, requested) {
  const ids = requested.map((r) => r.serviceId);
  const services = await db.service.findMany({ where: { id: { in: ids } } });
  const byId = new Map(services.map((s) => [s.id, s]));
  return requested.map((r) => {
    const s = byId.get(r.serviceId);
    if (!s || !s.isActive) {
      throw badRequest(`Услуга № ${r.serviceId} не найдена или отключена`, 'SERVICE_NOT_AVAILABLE');
    }
    return {
      serviceId: s.id,
      serviceNameSnapshot: s.name,
      unitPriceSnapshot: s.price,
      quantity: r.quantity,
    };
  });
}

function sumItems(items) {
  const total = items.reduce((acc, i) => acc + i.unitPriceSnapshot * i.quantity, 0);
  if (total > MAX_INT) throw badRequest('Слишком большая сумма заказа', 'TOTAL_TOO_LARGE');
  return total;
}

const addEvent = (db, data) => db.orderEvent.create({ data });

// ---------- список и карточка ----------

export async function list(filters, paging) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = startOfLocalDay(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lt = startOfNextLocalDay(filters.dateTo);
  }
  if (filters.overdue) {
    // карточка «Срок прошёл» на главной: срок раньше сегодняшнего дня, заказ не выдан и не отменён
    where.dueDate = { lt: new Date(todayInWorkshop() + 'T00:00:00Z') };
    where.status = { in: ['NEW', 'IN_PROGRESS', 'READY'] };
  }
  if (filters.search) {
    const digits = filters.search.replace(/\D/g, '');
    const or = [{ client: { fullName: { contains: filters.search, mode: 'insensitive' } } }];
    if (digits) {
      or.push({ client: { phone: { contains: digits } } });
      if (/^\d+$/.test(digits) && Number(digits) <= MAX_INT) or.push({ id: Number(digits) });
    }
    where.AND = [{ OR: or }];
  }

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: paging.skip,
      take: paging.take,
      include: { client: { select: { id: true, fullName: true, phone: true } } },
    }),
    prisma.order.count({ where }),
  ]);
  return { items: rows.map(formatListItem), total, page: paging.page, pageSize: paging.pageSize };
}

export const getById = (id) => loadDetail(prisma, id);

export async function events(id) {
  const exists = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw notFound('Заказ не найден');
  const rows = await prisma.orderEvent.findMany({
    where: { orderId: id },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { actor: { select: { id: true, fullName: true } } },
  });
  return {
    items: rows.map((e) => ({
      id: e.id,
      type: e.type,
      oldValue: e.oldValue,
      newValue: e.newValue,
      comment: e.comment,
      actorId: e.actorId,
      actor: e.actor,
      createdAt: e.createdAt,
    })),
  };
}

// ---------- создание ----------

export async function create(input, actor) {
  return prisma.$transaction(async (tx) => {
    await checkClient(tx, input.clientId);
    await checkAssignee(tx, input.assigneeId);
    const items = await buildNewItems(tx, input.items);
    const totalAmount = sumItems(items);

    // BR-15: автора, статус и время ставит сервер
    const order = await tx.order.create({
      data: {
        clientId: input.clientId,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        comment: input.comment,
        createdById: actor.id,
        status: 'NEW',
        paymentStatus: 'UNPAID',
        totalAmount,
        items: { create: items },
      },
    });
    await addEvent(tx, { orderId: order.id, actorId: actor.id, type: 'CREATED', newValue: 'NEW' });
    return loadDetail(tx, order.id);
  });
}

// ---------- редактирование ----------

export async function update(id, input, actor) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw notFound('Заказ не найден');

    const notEditable = () =>
      conflict('ORDER_NOT_EDITABLE', 'Заказ можно менять только в статусах «Новый» и «В работе», пока он не оплачен');
    if (!EDITABLE.includes(order.status) || order.paymentStatus !== 'UNPAID') throw notEditable();

    if (input.clientId !== undefined) await checkClient(tx, input.clientId);
    if (input.assigneeId !== undefined) await checkAssignee(tx, input.assigneeId);

    const data = { updatedAt: new Date() };
    for (const f of ['clientId', 'assigneeId', 'dueDate', 'comment']) {
      if (input[f] !== undefined) data[f] = input[f];
    }

    if (input.items) {
      const existing = new Map(order.items.map((i) => [i.serviceId, i]));
      const newOnes = input.items.filter((r) => !existing.has(r.serviceId));
      const added = await buildNewItems(tx, newOnes);

      // старые позиции сохраняют цену из снимка, меняется только количество
      const finalItems = input.items.map((r) => {
        const old = existing.get(r.serviceId);
        return old
          ? { ...old, quantity: r.quantity }
          : added.find((a) => a.serviceId === r.serviceId);
      });
      data.totalAmount = sumItems(finalItems);

      await tx.orderItem.deleteMany({
        where: { orderId: id, serviceId: { notIn: input.items.map((r) => r.serviceId) } },
      });
      for (const r of input.items) {
        const old = existing.get(r.serviceId);
        if (old) await tx.orderItem.update({ where: { id: old.id }, data: { quantity: r.quantity } });
      }
      if (added.length) await tx.orderItem.createMany({ data: added.map((a) => ({ ...a, orderId: id })) });
    }

    // BR-17: запись обновляется, только если заказ всё ещё в допустимом состоянии
    const { count } = await tx.order.updateMany({
      where: { id, status: { in: EDITABLE }, paymentStatus: 'UNPAID' },
      data,
    });
    if (count === 0) throw notEditable();

    await addEvent(tx, {
      orderId: id,
      actorId: actor.id,
      type: 'ORDER_UPDATED',
      comment: input.items ? 'Изменены позиции заказа' : 'Изменены данные заказа',
    });
    return loadDetail(tx, id);
  });
}

// ---------- статус ----------

export async function changeStatus(id, { status, reason }, actor) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw notFound('Заказ не найден');

    if (!TRANSITIONS[order.status].includes(status)) {
      throw conflict('INVALID_STATUS_TRANSITION', `Нельзя перевести заказ из ${order.status} в ${status}`);
    }

    // какая оплата нужна для этого перехода
    let requiredPayment;
    if (status === 'ISSUED') {
      if (order.paymentStatus !== 'PAID') throw conflict('ORDER_NOT_PAID', 'Нельзя выдать заказ без оплаты'); // BR-11
      requiredPayment = 'PAID';
    }
    if (status === 'CANCELLED') {
      if (order.paymentStatus === 'PAID') throw conflict('ORDER_PAID', 'Оплаченный заказ нельзя отменить'); // BR-12
      if (order.status === 'READY') {
        // BR-26: из «Готов» отменяет только администратор и только с причиной
        if (actor.role !== 'ADMIN') throw forbidden('Готовый заказ может отменить только администратор');
        if (!reason) throw badRequest('Укажите причину отмены', 'REASON_REQUIRED');
      }
      requiredPayment = 'UNPAID';
    }

    const data = { status };
    if (status === 'ISSUED') data.issuedAt = new Date();
    if (status === 'CANCELLED' && reason) data.cancelReason = reason;

    const where = { id, status: order.status };
    if (requiredPayment) where.paymentStatus = requiredPayment;
    const { count } = await tx.order.updateMany({ where, data });
    if (count === 0) throw conflict('ORDER_CHANGED', 'Заказ уже изменили, обновите страницу');

    await addEvent(tx, {
      orderId: id,
      actorId: actor.id,
      type: 'STATUS_CHANGED',
      oldValue: order.status,
      newValue: status,
      comment: status === 'CANCELLED' ? reason ?? null : null,
    });
    return { id, status, changedAt: new Date() };
  });
}

// ---------- оплата ----------

export async function changePayment(id, { paymentStatus }, actor) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw notFound('Заказ не найден');

    // BR-13: отметка меняется только у не выданного и не отменённого заказа
    if (order.status === 'ISSUED' || order.status === 'CANCELLED') {
      throw conflict('PAYMENT_LOCKED', 'У выданного или отменённого заказа оплату менять нельзя');
    }
    if (order.paymentStatus === paymentStatus) {
      throw conflict('PAYMENT_UNCHANGED', 'У заказа уже стоит такая отметка оплаты');
    }
    if (paymentStatus === 'UNPAID' && actor.role !== 'ADMIN') {
      throw forbidden('Снять отметку оплаты может только администратор');
    }

    const now = new Date();
    const data =
      paymentStatus === 'PAID'
        ? { paymentStatus, paidAt: now, paidById: actor.id }
        : { paymentStatus, paidAt: null, paidById: null };

    const { count } = await tx.order.updateMany({
      where: { id, paymentStatus: order.paymentStatus, status: { notIn: ['ISSUED', 'CANCELLED'] } },
      data,
    });
    if (count === 0) throw conflict('ORDER_CHANGED', 'Заказ уже изменили, обновите страницу');

    await addEvent(tx, {
      orderId: id,
      actorId: actor.id,
      type: 'PAYMENT_CHANGED',
      oldValue: order.paymentStatus,
      newValue: paymentStatus,
    });
    return { id, paymentStatus, paidAt: data.paidAt, paidById: data.paidById };
  });
}

// ---------- переделка (BR-25) ----------

export async function rework(id, { reason }, actor) {
  return prisma.$transaction(async (tx) => {
    const source = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!source) throw notFound('Заказ не найден');
    if (source.status !== 'READY' && source.status !== 'ISSUED') {
      throw new AppError(409, 'REWORK_NOT_ALLOWED', 'Переделку можно оформить только по готовому или выданному заказу');
    }

    const comment = `Переделка по заказу № ${id}` + (reason ? `: ${reason}` : '');
    // позиции копируются с нулевой ценой, платить нечего, поэтому оплата сразу PAID
    const created = await tx.order.create({
      data: {
        clientId: source.clientId,
        createdById: actor.id,
        comment,
        status: 'NEW',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        paidById: actor.id,
        totalAmount: 0,
        items: {
          create: source.items.map((i) => ({
            serviceId: i.serviceId,
            serviceNameSnapshot: i.serviceNameSnapshot,
            unitPriceSnapshot: 0,
            quantity: i.quantity,
          })),
        },
      },
    });

    await addEvent(tx, { orderId: created.id, actorId: actor.id, type: 'CREATED', newValue: 'NEW', comment });
    // исходный заказ не меняется, в его историю только добавляется запись
    await addEvent(tx, {
      orderId: id,
      actorId: actor.id,
      type: 'ORDER_UPDATED',
      comment: `Оформлена переделка № ${created.id}`,
    });

    return {
      id: created.id,
      status: created.status,
      paymentStatus: created.paymentStatus,
      totalAmount: 0,
      comment,
    };
  });
}
