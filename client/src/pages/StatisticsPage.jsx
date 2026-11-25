import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getOverview } from '../api/stats.api.js';
import { useLoad } from '../utils/useLoad.js';
import { monthStartString, todayString } from '../utils/formatDate.js';
import { formatPrice } from '../utils/formatPrice.js';
import { STATUS_LABELS } from '../utils/statusLabels.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

const BAR = { NEW: '#2563eb', IN_PROGRESS: '#f59e0b', READY: '#10b981', ISSUED: '#475569', CANCELLED: '#f43f5e' };
const addDays = (s, n) => new Date(new Date(s + 'T00:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);

export default function StatisticsPage() {
  const [form, setForm] = useState({ from: monthStartString(), to: todayString() });
  const [period, setPeriod] = useState(form);
  const { data, error } = useLoad(() => getOverview(period), [period.from, period.to]);

  const quick = (from) => { const p = { from, to: todayString() }; setForm(p); setPeriod(p); };
  const total = data?.ordersCreated || 0;

  return (
    <div className="stack">
      <div><h1>Статистика</h1><div className="muted">Доступно только администратору</div></div>

      <form className="card" onSubmit={(e) => { e.preventDefault(); setPeriod(form); }}>
        <div className="card-title">Период</div>
        <div className="filters">
          <div className="field"><label htmlFor="f">С</label><input id="f" type="date" className="input" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></div>
          <div className="field"><label htmlFor="t">По</label><input id="t" type="date" className="input" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></div>
          <button type="button" className="btn sm" onClick={() => quick(todayString())}>Сегодня</button>
          <button type="button" className="btn sm" onClick={() => quick(addDays(todayString(), -6))}>Неделя</button>
          <button type="button" className="btn sm" onClick={() => quick(monthStartString())}>Месяц</button>
          <button className="btn primary" style={{ marginLeft: 'auto' }}>Показать</button>
        </div>
      </form>

      <ErrorMessage error={error} />
      {data && (
        <>
          <div className="card-title" style={{ margin: '12px 0 0' }}>Главные показатели</div>
          <div className="grid3">
            <div className="card kpi"><span className="muted">Всего заказов</span><div className="big num">{data.ordersCreated} <span className="small muted" style={{ fontWeight: 400 }}>за период</span></div></div>
            <div className="card kpi"><span className="muted">Оплачено заказов</span><div className="big num">{data.paidOrders}</div></div>
            <div className="card kpi"><span className="muted">Выручка (оплаченные)</span><div className="big num">{formatPrice(data.revenuePaid)}</div></div>
          </div>

          <div className="card-title" style={{ margin: '12px 0 0' }}>Заказы по статусам</div>
          <section className="card flush">
            <table>
              <thead><tr><th>Статус</th><th>Количество</th><th style={{ width: '45%' }}>Доля от общего объёма</th><th></th></tr></thead>
              <tbody>
                {Object.keys(STATUS_LABELS).map((s) => {
                  const n = data.byStatus[s];
                  const pct = total ? Math.round((n / total) * 100) : 0;
                  return (
                    <tr key={s}>
                      <td><span className={`badge st-${s}`}>{STATUS_LABELS[s]}</span></td>
                      <td className="num"><b>{n}</b> <span className="muted small">{n === 1 ? 'заказ' : 'заказов'}</span></td>
                      <td><div className="row"><div className="bar" style={{ flex: 1 }}><i style={{ width: `${pct}%`, background: BAR[s] }} /></div><span className="small muted" style={{ width: 36, textAlign: 'right' }}>{pct}%</span></div></td>
                      <td className="right"><Link to={`/orders?status=${s}&dateFrom=${data.period.from}&dateTo=${data.period.to}`}>→</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-foot">
              <span className="small">Выручка — сумма оплаченных заказов по дате оплаты. Количество заказов — по дате создания.</span>
              <Link to={`/orders?dateFrom=${data.period.from}&dateTo=${data.period.to}`}>Открыть заказы за период →</Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
