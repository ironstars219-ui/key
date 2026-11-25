// Проверки без базы данных: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from '../src/utils/phone.js';
import { isValidDateString, isOverdue, todayInWorkshop, dateToString, parseDateOnly } from '../src/utils/dates.js';
import { createOrderInput, statusInput, orderListQuery } from '../src/validators/orders.validator.js';
import { createClientInput } from '../src/validators/clients.validator.js';

test('телефон приводится к +7XXXXXXXXXX (BR-03)', () => {
  assert.equal(normalizePhone('8 701 123-45-67'), '+77011234567');
  assert.equal(normalizePhone('+7 (701) 123-45-67'), '+77011234567');
  assert.equal(normalizePhone('77011234567'), '+77011234567');
  assert.throws(() => normalizePhone('12345'));
  assert.throws(() => normalizePhone(''));
});

test('dueDate — только дата', () => {
  assert.ok(isValidDateString('2026-11-20'));
  assert.ok(!isValidDateString('2026-11-20T10:00'));
  assert.ok(!isValidDateString('2026-02-30'));
  assert.equal(dateToString(parseDateOnly('2026-11-20')), '2026-11-20');
});

test('срок прошёл — отметка, а не статус (BR-23)', () => {
  const now = new Date('2026-11-25T10:00:00Z'); // в Алматы 15:00 25.11
  assert.equal(todayInWorkshop(now), '2026-11-25');
  const due = (s, status) => ({ dueDate: parseDateOnly(s), status });
  assert.equal(isOverdue(due('2026-11-24', 'IN_PROGRESS'), now), true);
  assert.equal(isOverdue(due('2026-11-25', 'IN_PROGRESS'), now), false);
  assert.equal(isOverdue(due('2026-11-24', 'ISSUED'), now), false);
  assert.equal(isOverdue(due('2026-11-24', 'CANCELLED'), now), false);
  assert.equal(isOverdue({ dueDate: null, status: 'NEW' }, now), false);
});

test('сутки в мастерской: 20:00 UTC уже следующий день в Алматы', () => {
  assert.equal(todayInWorkshop(new Date('2026-11-25T20:00:00Z')), '2026-11-26');
});

test('заказ: цену и итог из браузера не принимаем (BR-08)', () => {
  const ok = createOrderInput({ items: [{ serviceId: 1, quantity: 2 }] });
  assert.equal(ok.clientId, null);
  assert.throws(() => createOrderInput({ items: [{ serviceId: 1, quantity: 2, price: 1 }] }));
  assert.throws(() => createOrderInput({ totalAmount: 1, items: [{ serviceId: 1, quantity: 1 }] }));
  assert.throws(() => createOrderInput({ items: [] }));
  assert.throws(() => createOrderInput({ items: [{ serviceId: 1, quantity: 0 }] }));
  assert.throws(() => createOrderInput({ items: [{ serviceId: 1, quantity: 1.5 }] }));
  assert.throws(() => createOrderInput({ items: [{ serviceId: 1, quantity: 1 }, { serviceId: 1, quantity: 2 }] }));
  assert.throws(() => createOrderInput({ dueDate: '2026-11-20 18:00', items: [{ serviceId: 1, quantity: 1 }] }));
});

test('статус: допустимы только пять значений', () => {
  assert.equal(statusInput({ status: 'READY' }).status, 'READY');
  assert.throws(() => statusInput({ status: 'OVERDUE' }));
  assert.throws(() => statusInput({ status: 'ISSUED', issuedAt: 'x' }));
});

test('фильтры списка заказов', () => {
  assert.deepEqual(orderListQuery({ status: 'NEW', overdue: 'true' }), { status: 'NEW', overdue: true });
  assert.throws(() => orderListQuery({ paymentStatus: 'PENDING' }));
});

test('клиент: имя и телефон обязательны', () => {
  assert.deepEqual(createClientInput({ fullName: ' Ержан ', phone: '8 701 123-45-67' }), {
    fullName: 'Ержан',
    phone: '+77011234567',
  });
  assert.throws(() => createClientInput({ fullName: '', phone: '8 701 123-45-67' }));
});
