import { useState } from 'react';
import { createService, listServices, updateService } from '../api/services.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoad } from '../utils/useLoad.js';
import PriceText from '../components/PriceText.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

// Сотрудник только смотрит каталог, администратор меняет (BR-02)
export default function ServicesPage() {
  const { isAdmin } = useAuth();
  const { data, error, reload } = useLoad(() => listServices(isAdmin ? { includeInactive: 'true' } : {}), [isAdmin]);
  const [form, setForm] = useState({ name: '', price: '' });
  const [edit, setEdit] = useState(null); // { id, name, price }
  const [actionError, setActionError] = useState(null);

  async function act(fn) {
    setActionError(null);
    try { await fn(); reload(); } catch (e) { setActionError(e); }
  }

  return (
    <div className="stack">
      <div className="page-head"><div><h1>Услуги</h1><div className="muted">Цены в тенге. Старые заказы хранят цену на момент оформления.</div></div></div>

      {isAdmin && (
        <form className="card" onSubmit={(e) => { e.preventDefault(); act(async () => { await createService({ name: form.name.trim(), price: Number(form.price) }); setForm({ name: '', price: '' }); }); }}>
          <div className="card-title">Добавить услугу</div>
          <div className="filters">
            <div className="field grow"><label htmlFor="sn">Название</label><input id="sn" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="sp">Цена, ₸</label><input id="sp" className="input" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })} /></div>
            <button className="btn primary" disabled={!form.name.trim() || form.price === ''}>Добавить</button>
          </div>
        </form>
      )}

      <ErrorMessage error={error || actionError} />
      <section className="card flush">
        {data && (
          <table>
            <thead><tr><th>Услуга</th><th className="right">Цена</th><th>Доступна</th>{isAdmin && <th></th>}</tr></thead>
            <tbody>
              {data.items.map((s) => edit?.id === s.id ? (
                <tr key={s.id}>
                  <td><input className="input" aria-label="Название" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></td>
                  <td><input className="input" aria-label="Цена" style={{ textAlign: 'right' }} value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value.replace(/\D/g, '') })} /></td>
                  <td></td>
                  <td className="right nowrap">
                    <button className="btn primary sm" onClick={() => act(async () => { await updateService(s.id, { name: edit.name.trim(), price: Number(edit.price) }); setEdit(null); })}>Сохранить</button>{' '}
                    <button className="btn sm" onClick={() => setEdit(null)}>Отмена</button>
                  </td>
                </tr>
              ) : (
                <tr key={s.id} style={s.isActive ? undefined : { opacity: 0.6 }}>
                  <td>{s.name}</td><td className="right"><PriceText value={s.price} /></td>
                  <td>{s.isActive ? 'Да' : 'Нет, отключена'}</td>
                  {isAdmin && (
                    <td className="right nowrap">
                      <button className="btn sm" onClick={() => setEdit({ id: s.id, name: s.name, price: String(s.price) })}>Изменить</button>{' '}
                      <button className={`btn sm ${s.isActive ? 'danger' : ''}`} onClick={() => act(() => updateService(s.id, { isActive: !s.isActive }))}>{s.isActive ? 'Отключить' : 'Включить'}</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
