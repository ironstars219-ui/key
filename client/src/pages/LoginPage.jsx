import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const go = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(login.trim(), password);
      go('/');
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card stack" onSubmit={submit}>
        <div>
          <div className="logo" style={{ marginBottom: 8 }}>Ключ<b>Учёт</b></div>
          <h2>Вход в систему</h2>
        </div>
        <div className="field">
          <label htmlFor="login">Логин</label>
          <input id="login" className="input" value={login} onChange={(e) => setLogin(e.target.value)} autoFocus autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="pw">Пароль</label>
          <input id="pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <ErrorMessage error={error} />
        <button className="btn primary big block" disabled={busy || !login || !password}>Войти</button>
      </form>
    </div>
  );
}
