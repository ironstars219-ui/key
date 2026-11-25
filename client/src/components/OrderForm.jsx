// Форма заказа: создание и редактирование. Цены здесь только показываются,
// итог считает сервер (BR-08), «Предварительно» — подсказка.
import { useEffect, useMemo, useState } from 'react';
import { listClients } from '../api/clients.api.js';
import { listServices } from '../api/services.api.js';
import { listUsers } from '../api/users.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoad } from '../utils/useLoad.js';
import { formatPrice } from '../utils/formatPrice.js';
import { todayString } from '../utils/formatDate.js';
import ErrorMessage from './ErrorMessage.jsx';
import PriceText from './PriceText.jsx';

// initial: заказ из GET /orders/:id (при редактировании) или null
export default function OrderForm({ initial, submitLabel, onSubmit, onCancel, allowClientChange = true }) {
  const { user, isAdmin } = useAuth();
  const { data: svc } = useLoad(() => listServices(), []);
  const { data: staff } = useLoad(() => (isAdmin ? listUsers() : Promise.resolve(null)), [isAdmin]);

  const [quick, setQuick] = useState(initial ? !initial.client : false);
  const [client, setClient] = useState(initial?.client ?? null);
  const [search, setSearch] = useState('');
  const [found, setFound] = useState([]);
  const [qty, setQty] = useState(() => Object.fromEntries((initial?.items ?? []).map((i) => [i.serviceId, i.quantity])));
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [assigneeId, setAssigneeId] = useState(initial?.assignee?.id ?? '');
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // поиск клиента по имени или телефону
  useEffect(() => {
    if (quick || client || search.trim().length < 2) return setFound([]);
    const t = setTimeout(() => listClients({ search: search.trim(), pageSize: 5 }).then((r) => setFound(r.items)).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [search, quick, client]);

  // каталог + услуги, которые уже есть в заказе, но потом были отключены
  const rows = useMemo(() => {
    const list = (svc?.items ?? []).map((s) => ({ id: s.id, name: s.name, price: s.price }));
    for (const i of initial?.items ?? []) {
      if (!list.some((s) => s.id === i.serviceId)) list.push({ id: i.serviceId, name: i.serviceNameSnapshot, price: i.unitPriceSnapshot });
    }
    return list;
  }, [svc, initial]);

  // в заказе остаются старые цены из снимка, новые услуги — по каталогу
  const priceOf = (s) => initial?.items.find((i) => i.serviceId === s.id)?.unitPriceSnapshot ?? s.price;
  const chosen = rows.filter((s) => qty[s.id] > 0);
  const total = chosen.reduce((a, s) => a + priceOf(s) * qty[s.id], 0);

  const setQ = (id, v) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(1000, v)) }));

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!quick && !client) return setError(new Error('Выберите клиента или включите «Быстрый заказ без клиента»'));
    if (!chosen.length) return setError(new Error('Выберите хотя бы одну услугу'));
    const data = {
      clientId: quick ? null : client.id,
      assigneeId: assigneeId === '' ? null : Number(assigneeId),
      dueDate: dueDate || null,
      comment: comment.trim() || null,
      items: chosen.map((s) => ({ serviceId: s.id, quantity: qty[s.id] })),
    };
    setBusy(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  // исполнитель: админ видит всех сотрудников, сотрудник — только себя
  const people = isAdmin ? (staff?.items ?? []).filter((u) => u.isActive) : [{ id: user.id, fullName: user.fullName }];

  return (
    <form onSubmit={submit} className="grid2">
      <div className="stack">
        <section className="card">
          <div className="card-title">1. Клиент</div>
          {allowClientChange && (
            <div className="radio-row">
              <label><input type="radio" checked={!quick} onChange={() => setQuick(false)} /> Клиент из базы</label>
              <label><input type="radio" checked={quick} onChange={() => { setQuick(true); setClient(null); }} /> Быстрый заказ без клиента</label>
            </div>
          )}
          {quick ? (
            <p className="muted" style={{ margin: 0 }}>Заказ оформится без карточки клиента.</p>
          ) : client ? (
            <div className="picked">
              <span><b>{client.fullName}</b> <span className="muted">· {client.phone}</span></span>
              {allowClientChange && <button type="button" className="btn quiet sm" onClick={() => setClient(null)}>Выбрать другого</button>}
            </div>
          ) : (
            <div className="field">
              <label htmlFor="cs">Поиск клиента по имени или телефону</label>
              <input id="cs" className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Например, Ержан или 701 123" />
              {found.map((c) => (
                <div key={c.id} className="picked" style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setClient(c)}>
                  <span><b>{c.fullName}</b> <span className="muted">· {c.phone}</span></span>
                  <span className="small">Выбрать</span>
                </div>
              ))}
              <div className="hint">Нет в списке? Добавьте клиента на странице «Клиенты».</div>
            </div>
          )}
        </section>

        <section className="card flush">
          <div className="card-title" style={{ padding: '24px 24px 0' }}>2. Услуги из каталога</div>
          <table>
            <thead><tr><th>Услуга</th><th className="right">Цена</th><th>Кол-во</th><th className="right">Сумма</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td className="right"><PriceText value={priceOf(s)} /></td>
                  <td>
                    <span className="qty">
                      <button type="button" aria-label="Меньше" disabled={!qty[s.id]} onClick={() => setQ(s.id, (qty[s.id] || 0) - 1)}>−</button>
                      <span>{qty[s.id] || 0}</span>
                      <button type="button" aria-label="Больше" onClick={() => setQ(s.id, (qty[s.id] || 0) + 1)}>+</button>
                    </span>
                  </td>
                  <td className="right">{qty[s.id] ? <PriceText value={priceOf(s) * qty[s.id]} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="card-title">3. Дополнительно (необязательно)</div>
          <div className="cols2">
            <div className="field">
              <label htmlFor="due">Срок готовности</label>
              <input id="due" type="date" className="input" min={initial ? undefined : todayString()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <div className="hint">Только дата, без времени</div>
            </div>
            <div className="field">
              <label htmlFor="as">Исполнитель</label>
              <select id="as" className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="">Не назначен</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label htmlFor="cm">Комментарий</label>
            <textarea id="cm" className="input" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />
          </div>
        </section>
      </div>

      <aside className="card stack" style={{ position: 'sticky', top: 16 }}>
        <h2>Ваш заказ</h2>
        <div>
          {chosen.length === 0 && <div className="muted">Услуги пока не выбраны</div>}
          {chosen.map((s) => (
            <div className="sum-line" key={s.id}><span>{s.name} × {qty[s.id]}</span><PriceText value={priceOf(s) * qty[s.id]} /></div>
          ))}
          <div className="sum-total"><span>Предварительно:</span><span className="total num">{formatPrice(total)}</span></div>
          <div className="hint">Окончательную сумму считает сервер при сохранении заказа</div>
        </div>
        <ErrorMessage error={error} />
        <button className="btn primary big block" disabled={busy}>{submitLabel}</button>
        <button type="button" className="btn block" onClick={onCancel}>Отмена</button>
      </aside>
    </form>
  );
}
