import { useState } from 'react';
import { createUser, listUsers, updateUser } from '../api/users.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLoad } from '../utils/useLoad.js';
import { ROLE_LABELS } from '../utils/statusLabels.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const EMPTY = { fullName: '', login: '', password: '', role: 'EMPLOYEE' };

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const { data, error, reload } = useLoad(() => listUsers(), []);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [disable, setDisable] = useState(null);

  async function add(e) {
    e.preventDefault();
    setFormError(null);
    try { await createUser(form); setForm(EMPTY); reload(); } catch (err) { setFormError(err); }
  }

  async function toggle(u, isActive) {
    setActionError(null);
    try { await updateUser(u.id, { isActive }); reload(); } catch (err) { setActionError(err); }
  }

  return (
    <div className="stack">
      <div><h1>Сотрудники</h1><div className="muted">Новых сотрудников создаёт только администратор. Регистрации через сайт нет.</div></div>

      <form className="card" onSubmit={add}>
        <div className="card-title">Добавить сотрудника</div>
        <div className="filters">
          <div className="field grow"><label htmlFor="un">ФИО</label><input id="un" className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div className="field"><label htmlFor="ul">Логин</label><input id="ul" className="input" autoComplete="off" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} /></div>
          <div className="field"><label htmlFor="up">Пароль (от 8 символов)</label><input id="up" type="password" className="input" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="field"><label htmlFor="ur">Роль</label>
            <select id="ur" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="EMPLOYEE">Сотрудник</option><option value="ADMIN">Администратор</option>
            </select></div>
          <button className="btn primary" disabled={!form.fullName.trim() || form.login.trim().length < 3 || form.password.length < 8}>Добавить</button>
        </div>
        {formError && <div style={{ marginTop: 12 }}><ErrorMessage error={formError} /></div>}
      </form>

      <ErrorMessage error={error || actionError} />
      <section className="card flush">
        {data && (
          <table>
            <thead><tr><th>ФИО</th><th>Логин</th><th>Роль</th><th>Доступ</th><th></th></tr></thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} style={u.isActive ? undefined : { opacity: 0.6 }}>
                  <td>{u.fullName}{u.id === me.id && <span className="muted"> (это вы)</span>}</td>
                  <td>{u.login}</td><td>{ROLE_LABELS[u.role]}</td><td>{u.isActive ? 'Работает' : 'Отключён'}</td>
                  <td className="right">
                    {u.isActive
                      ? <button className="btn danger sm" disabled={u.id === me.id} onClick={() => setDisable(u)}>Отключить</button>
                      : <button className="btn sm" onClick={() => toggle(u, true)}>Включить</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {disable && (
        <ConfirmDialog
          title={`Отключить сотрудника «${disable.fullName}»?`} text="Он больше не сможет войти в систему. Его заказы и история сохранятся."
          confirmLabel="Отключить" danger onClose={() => setDisable(null)}
          onConfirm={async () => { await updateUser(disable.id, { isActive: false }); setDisable(null); reload(); }}
        />
      )}
    </div>
  );
}
