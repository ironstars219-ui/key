import { badRequest } from '../utils/AppError.js';
import { parseDateOnly } from '../utils/dates.js';
import { readBody, str, int } from './common.js';

const STATUSES = ['NEW', 'IN_PROGRESS', 'READY', 'ISSUED', 'CANCELLED'];

// BR-05: quantity — целое > 0, услуга в заказе не повторяется
function items(list) {
  if (!Array.isArray(list) || list.length === 0) throw badRequest('В заказе должна быть хотя бы одна позиция');
  const seen = new Set();
  return list.map((it, i) => {
    if (it === null || typeof it !== 'object') throw badRequest(`Позиция ${i + 1}: неверный формат`);
    const extra = Object.keys(it).filter((k) => !['serviceId', 'quantity'].includes(k));
    // цену и сумму из браузера не принимаем (BR-08)
    if (extra.length) throw badRequest(`Позиция ${i + 1}: недопустимые поля: ${extra.join(', ')}`);
    const serviceId = int(it.serviceId, 'serviceId', { min: 1 });
    const quantity = int(it.quantity, 'quantity', { min: 1, max: 1000 });
    if (seen.has(serviceId)) throw badRequest('Одна услуга не может повторяться в заказе');
    seen.add(serviceId);
    return { serviceId, quantity };
  });
}

function nullableId(v, name) {
  return v === null ? null : int(v, name, { min: 1 });
}

export function createOrderInput(body) {
  const b = readBody(body, ['clientId', 'assigneeId', 'dueDate', 'comment', 'items']);
  return {
    clientId: b.clientId === undefined ? null : nullableId(b.clientId, 'clientId'),
    assigneeId: b.assigneeId === undefined ? null : nullableId(b.assigneeId, 'assigneeId'),
    dueDate: b.dueDate === undefined || b.dueDate === null ? null : parseDateOnly(b.dueDate, 'dueDate'),
    comment: b.comment === undefined || b.comment === null ? null : str(b.comment, 'comment', { max: 500 }),
    items: items(b.items),
  };
}

export function updateOrderInput(body) {
  const b = readBody(body, ['clientId', 'assigneeId', 'dueDate', 'comment', 'items']);
  const data = {};
  if (b.clientId !== undefined) data.clientId = nullableId(b.clientId, 'clientId');
  if (b.assigneeId !== undefined) data.assigneeId = nullableId(b.assigneeId, 'assigneeId');
  if (b.dueDate !== undefined) data.dueDate = b.dueDate === null ? null : parseDateOnly(b.dueDate, 'dueDate');
  if (b.comment !== undefined) data.comment = b.comment === null ? null : str(b.comment, 'comment', { max: 500 });
  if (b.items !== undefined) data.items = items(b.items);
  if (!Object.keys(data).length) throw badRequest('Нет полей для изменения');
  return data;
}

export function statusInput(body) {
  const b = readBody(body, ['status', 'reason']);
  if (!STATUSES.includes(b.status)) throw badRequest(`status: допустимо ${STATUSES.join(', ')}`);
  return { status: b.status, reason: str(b.reason, 'reason', { max: 300, required: false }) };
}

export function paymentInput(body) {
  const b = readBody(body, ['paymentStatus']);
  if (!['PAID', 'UNPAID'].includes(b.paymentStatus)) throw badRequest('paymentStatus: допустимо PAID или UNPAID');
  return { paymentStatus: b.paymentStatus };
}

export function reworkInput(body) {
  const b = readBody(body ?? {}, ['reason']);
  return { reason: str(b.reason, 'reason', { max: 300, required: false }) };
}

export function orderListQuery(q) {
  const out = {};
  if (q.status !== undefined) {
    if (!STATUSES.includes(q.status)) throw badRequest(`status: допустимо ${STATUSES.join(', ')}`);
    out.status = q.status;
  }
  if (q.paymentStatus !== undefined) {
    if (!['PAID', 'UNPAID'].includes(q.paymentStatus)) throw badRequest('paymentStatus: допустимо PAID или UNPAID');
    out.paymentStatus = q.paymentStatus;
  }
  if (q.clientId !== undefined) out.clientId = int(Number(q.clientId), 'clientId', { min: 1 });
  if (q.dateFrom !== undefined) { parseDateOnly(q.dateFrom, 'dateFrom'); out.dateFrom = q.dateFrom; }
  if (q.dateTo !== undefined) { parseDateOnly(q.dateTo, 'dateTo'); out.dateTo = q.dateTo; }
  if (out.dateFrom && out.dateTo && out.dateFrom > out.dateTo) throw badRequest('dateFrom позже dateTo');
  if (q.overdue !== undefined) {
    if (q.overdue !== 'true') throw badRequest('overdue: допустимо только true');
    out.overdue = true;
  }
  if (typeof q.search === 'string' && q.search.trim()) out.search = q.search.trim().slice(0, 100);
  return out;
}
