import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient, listClients } from '../api/clients.api.js';
import { useLoad } from '../utils/useLoad.js';
import Pagination from '../components/Pagination.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, reload } = useLoad(() => listClients({ search, page, pageSize: 10 }), [search, page]);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [formError, setFormError] = useState(null);

  async function add(e) {
    e.preventDefault();
    setFormError(null);
    try {
      await createClient(form);
      setForm({ fullName: '', phone: '' });
      reload();
    } catch (err) { setFormError(err); }
  }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Клиенты</h1><div className="muted">{data ? `Найдено: ${data.total}` : ' '}</div></div></div>

      <form className="card" onSubmit={add}>
        <div className="card-title">Добавить клиента</div>
        <div className="filters">
          <div className="field grow"><label htmlFor="cn">Имя</label><input id="cn" className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div className="field"><label htmlFor="cp">Телефон</label><input id="cp" className="input" placeholder="8 701 123-45-67" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <button className="btn primary" disabled={!form.fullName.trim() || !form.phone.trim()}>Добавить</button>
        </div>
        {formError && <div style={{ marginTop: 12 }}><ErrorMessage error={formError} /></div>}
      </form>

      <div className="card"><div className="field"><label htmlFor="cs">Поиск</label>
        <input id="cs" className="input" placeholder="Имя или телефон" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div></div>

      <ErrorMessage error={error} />
      <section className="card flush">
        {data && (data.items.length === 0 ? <div className="empty">Клиентов не найдено</div> : (
          <table>
            <thead><tr><th>Имя</th><th>Телефон</th><th></th></tr></thead>
            <tbody>{data.items.map((c) => (
              <tr key={c.id}><td><Link to={`/clients/${c.id}`}>{c.fullName}</Link></td><td className="num">{c.phone}</td>
                <td className="right"><Link to={`/orders/new`} className="small">Новый заказ</Link></td></tr>
            ))}</tbody>
          </table>
        ))}
        {data && <Pagination {...data} onPage={setPage} />}
      </section>
    </div>
  );
}
