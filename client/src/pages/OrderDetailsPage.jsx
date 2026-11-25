import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as api from '../api/orders.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoad } from '../utils/useLoad.js';
import { formatDate, formatDateTime } from '../utils/formatDate.js';
import { formatPrice } from '../utils/formatPrice.js';
import { EVENT_LABELS, STATUS_LABELS, PAYMENT_LABELS } from '../utils/statusLabels.js';
import OrderStatusBadge from '../components/OrderStatusBadge.jsx';
import PaymentStatusBadge from '../components/PaymentStatusBadge.jsx';
import PriceText from '../components/PriceText.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

// следующий статус и подпись кнопки
const NEXT = {
  NEW: ['IN_PROGRESS', 'Взять в работу'],
  IN_PROGRESS: ['READY', 'Отметить готовым'],
  READY: ['ISSUED', 'Выдать клиенту'],
};

function eventText(e) {
  if (e.type === 'STATUS_CHANGED') {
    return `Статус изменён на «${STATUS_LABELS[e.newValue]}»` + (e.comment ? `. Причина: ${e.comment}` : '');
  }
  if (e.type === 'PAYMENT_CHANGED') return `Оплата: ${PAYMENT_LABELS[e.newValue].toLowerCase()}`;
  return e.comment ? `${EVENT_LABELS[e.type]}. ${e.comment}` : EVENT_LABELS[e.type];
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const go = useNavigate();
  const { isAdmin } = useAuth();
  const { data: o, error, reload } = useLoad(() => api.getOrder(id), [id]);
  const { data: ev, reload: reloadEvents } = useLoad(() => api.getEvents(id), [id]);
  const [dialog, setDialog] = useState(null); // 'cancel' | 'rework'
  const [actionError, setActionError] = useState(null);

  const refresh = () => { reload(); reloadEvents(); };
  async function run(fn) {
    setActionError(null);
    try { await fn(); refresh(); } catch (e) { setActionError(e); }
  }

  if (error) return <div className="stack"><ErrorMessage error={error} /><Link to="/orders">← К списку заказов</Link></div>;
  if (!o) return <div className="center muted">Загрузка…</div>;

  const unpaid = o.paymentStatus === 'UNPAID';
  const open = !['ISSUED', 'CANCELLED'].includes(o.status);
  const editable = ['NEW', 'IN_PROGRESS'].includes(o.status) && unpaid;
  const next = NEXT[o.status];
  const needPay = o.status === 'READY' && unpaid; // выдать нельзя без оплаты (BR-11)
  const canCancel = open && unpaid && (o.status !== 'READY' || isAdmin);
  // главная кнопка одна: сначала оплата готового заказа, иначе следующий статус
  const payIsMain = needPay;

  let message = null;
  if (o.status === 'READY' && unpaid) message = 'Работа готова. Клиент ещё не оплатил.';
  else if (o.status === 'READY') message = 'Работа готова и оплачена. Можно выдать клиенту.';
  else if (o.status === 'ISSUED') message = 'Заказ выдан клиенту.';
  else if (o.status === 'CANCELLED') message = 'Заказ отменён' + (o.cancelReason ? `: ${o.cancelReason}` : '.');

  return (
    <div className="stack">
      <div>
        <div className="crumbs"><Link to="/orders">Заказы</Link> / Заказ № {o.id}</div>
        <div className="row wrap">
          <h1>Заказ № {o.id}</h1><OrderStatusBadge status={o.status} /><PaymentStatusBadge status={o.paymentStatus} />
          {o.isOverdue && <span className="late-mark small">срок готовности прошёл</span>}
        </div>
      </div>

      <div className="grid2">
        <div className="stack">
          <section className="card">
            <div className="card-title">Информация о заказе</div>
            <dl className="kv cols2" style={{ margin: 0 }}>
              <div><dt>Клиент</dt><dd>{o.client ? <Link to={`/clients/${o.client.id}`}>{o.client.fullName} →</Link> : <span className="no-client">Без карточки клиента</span>}</dd></div>
              <div><dt>Телефон</dt><dd>{o.client?.phone ?? '—'}</dd></div>
              <div><dt>Оформил</dt><dd>{o.createdBy.fullName}</dd></div>
              <div><dt>Исполнитель</dt><dd>{o.assignee?.fullName ?? 'Не назначен'}</dd></div>
              <div><dt>Создан</dt><dd>{formatDateTime(o.createdAt)}</dd></div>
              <div><dt>Срок</dt><dd>{formatDate(o.dueDate)}</dd></div>
            </dl>
            {o.comment && <><div className="small muted">Комментарий</div><div>{o.comment}</div></>}
          </section>

          <section className="card flush">
            <div className="card-title" style={{ padding: '24px 24px 0' }}>Позиции заказа <span style={{ textTransform: 'none', fontWeight: 400 }}>(цены на момент оформления)</span></div>
            <table>
              <thead><tr><th>Услуга</th><th className="right">Цена</th><th className="right">Кол-во</th><th className="right">Сумма</th></tr></thead>
              <tbody>
                {o.items.map((i) => (
                  <tr key={i.id}><td>{i.serviceNameSnapshot}</td><td className="right"><PriceText value={i.unitPriceSnapshot} /></td><td className="right">{i.quantity}</td><td className="right"><PriceText value={i.lineTotal} /></td></tr>
                ))}
              </tbody>
            </table>
            <div className="table-foot" style={{ justifyContent: 'flex-end', gap: 16 }}>
              <b style={{ color: 'var(--text)', fontSize: 18 }}>Итого:</b><span className="total num" style={{ color: 'var(--text)' }}>{formatPrice(o.totalAmount)}</span>
            </div>
          </section>

          <section className="card">
            <div className="card-title">История заказа</div>
            <ul className="timeline">
              {[...(ev?.items ?? [])].reverse().map((e) => (
                <li key={e.id}>
                  <div><div style={{ fontWeight: 500 }}>{eventText(e)}</div><div className="small muted">{e.actor.fullName}</div></div>
                  <div className="small muted nowrap">{formatDateTime(e.createdAt)}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="card actions">
          <div><div className="card-title" style={{ marginBottom: 4 }}>Действия</div><h2>Что сделать дальше</h2></div>
          {message && <div className={o.status === 'CANCELLED' ? 'error-box' : 'info-box'}>{message}</div>}
          <ErrorMessage error={actionError} />

          {open && unpaid && (
            <button className={`btn block big ${payIsMain ? 'primary' : ''}`} onClick={() => run(() => api.changePayment(o.id, 'PAID'))}>Отметить оплату</button>
          )}
          {open && !unpaid && isAdmin && (
            <button className="btn quiet block" onClick={() => run(() => api.changePayment(o.id, 'UNPAID'))}>Снять отметку оплаты</button>
          )}

          {next && (
            <div>
              <button className={`btn block big ${payIsMain ? '' : 'primary'}`} disabled={needPay} onClick={() => run(() => api.changeStatus(o.id, next[0]))}>{next[1]}</button>
              {needPay && <div className="hint">Выдать можно только после оплаты</div>}
            </div>
          )}

          {open && (
            <div>
              {editable
                ? <Link to={`/orders/${o.id}/edit`} className="btn block">Редактировать</Link>
                : <button className="btn block" disabled>Редактировать</button>}
              {!editable && <div className="hint">Доступно только в статусах «Новый» / «В работе», пока заказ не оплачен</div>}
            </div>
          )}

          {['READY', 'ISSUED'].includes(o.status) && (
            <div>
              <button className="btn block" onClick={() => setDialog('rework')}>Оформить переделку</button>
              <div className="hint">Новый заказ на 0 ₸, этот заказ не изменится</div>
            </div>
          )}

          {open && (
            <div>
              <button className="btn danger block" disabled={!canCancel} onClick={() => setDialog('cancel')}>Отменить заказ</button>
              <div className="hint">
                {!unpaid ? 'Оплаченный заказ отменить нельзя'
                  : o.status === 'READY' ? (isAdmin ? 'Отмена из «Готов» — нужна причина' : 'Отмена из «Готов» — только администратор') : ' '}
              </div>
            </div>
          )}
        </aside>
      </div>

      {dialog === 'cancel' && (
        <ConfirmDialog
          title={`Отменить заказ № ${o.id}?`} text="Отменённый заказ нельзя вернуть в работу."
          confirmLabel="Отменить заказ" danger
          reasonLabel={o.status === 'READY' ? 'Причина отмены' : undefined}
          onClose={() => setDialog(null)}
          onConfirm={async (reason) => { await api.changeStatus(o.id, 'CANCELLED', reason || undefined); setDialog(null); refresh(); }}
        />
      )}
      {dialog === 'rework' && <ReworkDialog order={o} onClose={() => setDialog(null)} onDone={(newId) => go(`/orders/${newId}`)} />}
    </div>
  );
}

// окно «Оформить переделку» (экран 06)
function ReworkDialog({ order, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function create() {
    setBusy(true);
    setError(null);
    try { onDone((await api.createRework(order.id, reason.trim())).id); } catch (e) { setError(e); setBusy(false); }
  }

  return (
    <div className="overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="rw">
        <div className="dialog-head">
          <h2 id="rw">Оформить переделку</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>Будет создан новый заказ по заказу № {order.id}. Сам заказ № {order.id} не изменится.</p>
        </div>
        <div className="dialog-body stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="small muted">Клиент</span>
            <b>{order.client ? `${order.client.fullName} ${order.client.phone}` : 'Без карточки клиента'}</b>
          </div>
          <div className="card flush">
            <table>
              <thead><tr><th>Услуга</th><th className="right">Кол-во</th><th className="right">Было</th><th className="right">Станет</th></tr></thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td>{i.serviceNameSnapshot}</td><td className="right">{i.quantity}</td>
                    <td className="right muted nowrap" style={{ textDecoration: 'line-through' }}>{formatPrice(i.lineTotal)}</td>
                    <td className="right nowrap"><b>0 ₸</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3}><b>Итого по новому заказу</b></td><td className="right"><b>0 ₸</b></td></tr></tfoot>
            </table>
          </div>
          <div className="field">
            <label htmlFor="rr">Причина переделки <span className="muted" style={{ fontWeight: 400 }}>(необязательно)</span></label>
            <textarea id="rr" className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            <div className="hint">В комментарий нового заказа запишется: «Переделка по заказу № {order.id}{reason.trim() ? `: ${reason.trim()}` : ''}»</div>
          </div>
          <ErrorMessage error={error} />
        </div>
        <div className="dialog-foot">
          <button className="btn" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn primary" onClick={create} disabled={busy}>+ Создать переделку</button>
        </div>
      </div>
    </div>
  );
}
