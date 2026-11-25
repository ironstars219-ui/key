// Подписи из БД в интерфейсе. «Просрочен» и «Ожидает» здесь нет специально:
// просрочка — не статус, у оплаты только два значения.
export const STATUS_LABELS = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  READY: 'Готов',
  ISSUED: 'Выдан',
  CANCELLED: 'Отменён',
};

export const PAYMENT_LABELS = {
  PAID: 'Оплачен',
  UNPAID: 'Не оплачен',
};

export const ROLE_LABELS = {
  ADMIN: 'администратор',
  EMPLOYEE: 'сотрудник',
};

export const EVENT_LABELS = {
  CREATED: 'Заказ создан',
  ORDER_UPDATED: 'Заказ изменён',
  STATUS_CHANGED: 'Статус изменён',
  PAYMENT_CHANGED: 'Оплата изменена',
};
