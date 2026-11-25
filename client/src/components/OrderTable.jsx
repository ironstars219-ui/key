import { useNavigate } from 'react-router-dom';
import OrderStatusBadge from './OrderStatusBadge.jsx';
import PaymentStatusBadge from './PaymentStatusBadge.jsx';
import PriceText from './PriceText.jsx';
import { formatDate, formatDateTime } from '../utils/formatDate.js';

// Таблица заказов. compact — короткий вариант для главной (без колонки срока)
export default function OrderTable({ orders, compact = false }) {
  const go = useNavigate();
  if (!orders.length) return <div className="empty">Заказов не найдено</div>;
  return (
    <table>
      <thead>
        <tr>
          <th>№</th><th>Клиент{compact ? '' : ' / телефон'}</th><th className="right">Сумма</th><th>Статус</th><th>Оплата</th>
          {!compact && <th>Срок</th>}<th className={compact ? 'right' : ''}>Создан</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className={`click ${o.isOverdue ? 'late' : ''}`} onClick={() => go(`/orders/${o.id}`)}>
            <td className="order-no">№ {o.id}</td>
            <td>
              {o.client ? (
                <>
                  <div>{o.client.fullName}</div>
                  {!compact && <div className="phone">{o.client.phone}</div>}
                </>
              ) : <span className="no-client">Без карточки клиента</span>}
            </td>
            <td className="right"><PriceText value={o.totalAmount} /></td>
            <td><OrderStatusBadge status={o.status} /></td>
            <td><PaymentStatusBadge status={o.paymentStatus} /></td>
            {!compact && (
              <td className="nowrap">
                {o.isOverdue
                  ? <span className="late-mark">{formatDate(o.dueDate)} <small>· срок прошёл</small></span>
                  : formatDate(o.dueDate)}
              </td>
            )}
            <td className={`small muted nowrap ${compact ? 'right' : ''}`}>{formatDateTime(o.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
