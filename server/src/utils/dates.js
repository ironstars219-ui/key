import { badRequest } from './AppError.js';

// Мастерская в Алматы: UTC+5 без перехода на летнее время (BR-21)
const OFFSET = '+05:00';
const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// строка «ГГГГ-ММ-ДД» -> true, если такая дата существует
export function isValidDateString(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// dueDate хранится как дата без времени
export function parseDateOnly(s, fieldName = 'Дата') {
  if (!isValidDateString(s)) throw badRequest(`${fieldName}: ожидается дата в формате ГГГГ-ММ-ДД`);
  return new Date(s + 'T00:00:00Z');
}

export const dateToString = (d) => (d ? d.toISOString().slice(0, 10) : null);

// сегодняшняя дата в мастерской, «ГГГГ-ММ-ДД»
export function todayInWorkshop(now = new Date()) {
  return new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// начало местного дня как момент времени (для запросов к БД)
export function startOfLocalDay(s) {
  return new Date(`${s}T00:00:00${OFFSET}`);
}

// начало следующего местного дня: «по» включительно -> верхняя граница «<»
export function startOfNextLocalDay(s) {
  return new Date(startOfLocalDay(s).getTime() + DAY_MS);
}

// BR-23: срок прошёл, а заказ ещё не выдан и не отменён.
// Это отметка для интерфейса, а не статус заказа.
export function isOverdue(order, now = new Date()) {
  if (!order.dueDate) return false;
  if (order.status === 'ISSUED' || order.status === 'CANCELLED') return false;
  return dateToString(order.dueDate) < todayInWorkshop(now);
}
