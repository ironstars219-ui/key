import { Link } from 'react-router-dom';
import { listOrders } from '../api/orders.api.js';
import { getOverview } from '../api/stats.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoad } from '../utils/useLoad.js';
import { longToday, todayString } from '../utils/formatDate.js';
import { formatPrice } from '../utils/formatPrice.js';
import OrderTable from '../components/OrderTable.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

// Счётчики берём из total обычного списка заказов: pageSize=1 — сами заказы не нужны
const count = (params) => listOrders({ ...params, pageSize: 1 }).then((r) => r.total);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { data, error } = useLoad(async () => {
    const [n, p, r, late, recent] = await Promise.all([
      count({ status: 'NEW' }), count({ status: 'IN_PROGRESS' }), count({ status: 'READY' }),
      count({ overdue: 'true' }), listOrders({ pageSize: 5 }),
    ]);
    return { n, p, r, late, recent: recent.items };
  }, []);
  const { data: today } = useLoad(
    () => (isAdmin ? getOverview({ from: todayString(), to: todayString() }) : Promise.resolve(null)), [isAdmin],
  );

  const cards = data && [
    ['Новые', data.n, '/orders?status=NEW'],
    ['В работе', data.p, '/orders?status=IN_PROGRESS'],
    ['Готовы к выдаче', data.r, '/orders?status=READY'],
    ['Срок прошёл', data.late, '/orders?overdue=true', true],
  ];

  return (
    <div className="stack">
      <section className="card welcome">
        <div>
          <h1>Добрый день, {user.fullName.split(' ')[0]}!</h1>
          <div className="muted">Сегодня {longToday()}. Что происходит в мастерской:</div>
        </div>
        <Link to="/orders/new" className="btn primary big">+ Новый заказ</Link>
      </section>

      <ErrorMessage error={error} />
      <div className="grid4">
        {(cards ?? []).map(([label, n, to, alert]) => (
          <Link key={label} to={to} className={`card counter ${alert ? 'alert' : ''}`}>
            <span className="label">{label}</span>
            <div className="big num"><span>{n}</span><span className="arrow">→</span></div>
          </Link>
        ))}
      </div>

      {isAdmin && today && (
        <div className="admin-strip">
          <span><span className="badge st-ISSUED">ТОЛЬКО АДМИН</span>&nbsp; оплачено сегодня — <b>{today.paidOrders} {today.paidOrders === 1 ? 'заказ' : 'заказов'}, {formatPrice(today.revenuePaid)}</b></span>
          <Link to="/stats">Открыть статистику →</Link>
        </div>
      )}

      <section className="card flush">
        <div className="row" style={{ justifyContent: 'space-between', padding: '20px 16px 16px' }}>
          <h2>Последние заказы</h2><span className="small muted">Показано 5 последних</span>
        </div>
        {data && <OrderTable orders={data.recent} compact />}
        <div className="table-foot" style={{ justifyContent: 'flex-end' }}><Link to="/orders">Все заказы →</Link></div>
      </section>
    </div>
  );
}
