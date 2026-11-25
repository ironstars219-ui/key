const TZ = 'Asia/Almaty';

// «ГГГГ-ММ-ДД» -> «дд.мм.гггг» (срок готовности хранится только как дата)
export function formatDate(s) {
  if (!s) return '—';
  const [y, m, d] = String(s).slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

// момент времени -> «дд.мм.гггг, чч:мм» по времени мастерской
export function formatDateTime(iso) {
  if (!iso) return '—';
  const p = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso));
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('day')}.${g('month')}.${g('year')}, ${g('hour')}:${g('minute')}`;
}

// сегодняшняя дата в мастерской, «ГГГГ-ММ-ДД»
export function todayString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

export function monthStartString() {
  return todayString().slice(0, 8) + '01';
}

export function longToday() {
  return new Intl.DateTimeFormat('ru-RU', { timeZone: TZ, day: 'numeric', month: 'long' }).format(new Date());
}
