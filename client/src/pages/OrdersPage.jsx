import { Link, useSearchParams } from 'react-router-dom';
import { listOrders } from '../api/orders.api.js';
import { useLoad } from '../utils/useLoad.js';
import { STATUS_LABELS, PAYMENT_LABELS } from '../utils/statusLabels.js';
import OrderTable from '../components/OrderTable.jsx';
import Pagination from '../components/Pagination.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

// Фильтры лежат в адресной строке: на страницу можно перейти по ссылке (главная, статистика)
export default function OrdersPage() {
  const [sp, setSp] = useSearchParams();
  const f = {
    search: sp.get('search') ?? '', status: sp.get('status') ?? '', paymentStatus: sp.get('paymentStatus') ?? '',
    dateFrom: sp.get('dateFrom') ?? '', dateTo: sp.get('dateTo') ?? '', overdue: sp.get('overdue') ?? '',
    clientId: sp.get('clientId') ?? '', page: Number(sp.get('page') ?? 1),
  };
  const { data, error } = useLoad(() => listOrders({ ...f, pageSize: 8 }), [sp.toString()]);

  const set = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    if (k !== 'page') next.delete('page');
    setSp(next);
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div><h1>Заказы</h1><div className="muted">{data ? `Найдено: ${data.total}` : ' '}</div></div>
        <Link to="/orders/new" className="btn primary big">+ Новый заказ</Link>
      </div>

      <section className="card">
        <div className="filters">
          <div className="field grow">
            <label htmlFor="q">Поиск</label>
            <input id="q" className="input" placeholder="№ заказа, имя или телефон" defaultValue={f.search}
              onKeyDown={(e) => e.key === 'Enter' && set('search', e.target.value.trim())}
              onBlur={(e) => e.target.value.trim() !== f.search && set('search', e.target.value.trim())} />
          </div>
          <div className="field">
            <label htmlFor="st">Статус</label>
            <select id="st" className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="">Все</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pay">Оплата</label>
            <select id="pay" className="input" value={f.paymentStatus} onChange={(e) => set('paymentStatus', e.target.value)}>
              <option value="">Все</option>
              {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="df">Создан с</label>
            <input id="df" type="date" className="input" value={f.dateFrom} onChange={(e) => set('dateFrom', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="dt">по</label>
            <input id="dt" type="date" className="input" value={f.dateTo} onChange={(e) => set('dateTo', e.target.value)} />
          </div>
          <button className="btn quiet" onClick={() => setSp({})}>Сбросить</button>
        </div>
        {f.overdue && <div className="hint" style={{ marginTop: 12 }}>Показаны заказы, у которых срок готовности прошёл. <a href="#" onClick={(e) => { e.preventDefault(); set('overdue', ''); }}>Показать все</a></div>}
      </section>

      <ErrorMessage error={error} />
      <section className="card flush">
        {data && <OrderTable orders={data.items} />}
        {data && <Pagination {...data} onPage={(p) => set('page', String(p))} />}
      </section>
    </div>
  );
}
