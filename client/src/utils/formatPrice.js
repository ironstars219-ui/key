// 18000 -> «18 000 ₸»
export function formatPrice(value) {
  const n = Number(value) || 0;
  return n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';
}
