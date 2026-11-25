import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getClient, updateClient } from '../api/clients.api.js';
import { listOrders } from '../api/orders.api.js';
import { useLoad } from '../utils/useLoad.js';
import OrderTable from '../components/OrderTable.jsx';
import Pagination from '../components/Pagination.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ClientDetailsPage() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const { data: c, error, reload } = useLoad(() => getClient(id), [id]);
  const { data: orders } = useLoad(() => listOrders({ clientId: id, page, pageSize: 8 }), [id, page]);
  const [edit, setEdit] = useState(null);
  const [saveError, setSaveError] = useState(null);

  async function save(e) {
    e.preventDefault();
    setSaveError(null);
    try { await updateClient(id, edit); setEdit(null); reload(); } catch (err) { setSaveError(err); }
  }

  if (error) return <div className="stack"><ErrorMessage error={error} /><Link to="/clients">← К клиентам</Link></div>;
  if (!c) return <div className="center muted">Загрузка…</div>;

  return (
    <div className="stack">
      <div><div className="crumbs"><Link to="/clients">Клиенты</Link> / {c.fullName}</div><h1>{c.fullName}</h1></div>
      <section className="card">
        {edit ? (
          <form onSubmit={save} className="filters">
            <div className="field grow"><label htmlFor="en">Имя</label><input id="en" className="input" value={edit.fullName} onChange={(e) => setEdit({ ...edit, fullName: e.target.value })} /></div>
            <div className="field"><label htmlFor="ep">Телефон</label><input id="ep" className="input" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
            <button className="btn primary">Сохранить</button><button type="button" className="btn" onClick={() => setEdit(null)}>Отмена</button>
          </form>
        ) : (
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <dl className="kv cols2" style={{ margin: 0 }}><div><dt>Телефон</dt><dd style={{ margin: 0 }}>{c.phone}</dd></div><div><dt>Заказов</dt><dd style={{ margin: 0 }}>{c.ordersCount}</dd></div></dl>
            <button className="btn" onClick={() => setEdit({ fullName: c.fullName, phone: c.phone })}>Изменить данные</button>
          </div>
        )}
        {saveError && <div style={{ marginTop: 12 }}><ErrorMessage error={saveError} /></div>}
      </section>
      <section className="card flush">
        <div style={{ padding: '20px 16px 8px' }}><h2>История заказов</h2></div>
        {orders && <OrderTable orders={orders.items} />}
        {orders && <Pagination {...orders} onPage={setPage} />}
      </section>
    </div>
  );
}
