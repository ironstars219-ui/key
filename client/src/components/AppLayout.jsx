import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABELS } from '../utils/statusLabels.js';

export default function AppLayout() {
  const { user, signOut, isAdmin } = useAuth();
  return (
    <div className="app">
      <header className="header">
        <div className="header-in">
          <div className="logo">Ключ<b>Учёт</b></div>
          <nav className="nav">
            <NavLink to="/" end>Главная</NavLink>
            <NavLink to="/orders">Заказы</NavLink>
            <NavLink to="/clients">Клиенты</NavLink>
            <NavLink to="/services">Услуги</NavLink>
            {isAdmin && <NavLink to="/stats">Статистика</NavLink>}
            {isAdmin && <NavLink to="/admin/users">Сотрудники</NavLink>}
          </nav>
          <div className="me">
            <b>{user.fullName}</b>
            <span>{ROLE_LABELS[user.role]}</span>
          </div>
          <button className="btn quiet sm" onClick={signOut}>Выйти</button>
        </div>
      </header>
      <main className="main"><Outlet /></main>
      <footer className="footer">
        <div className="footer-in">
          <span>Мастерская ключей «КлючУчёт» · г. Алматы, пр. Абая 85 · +7 (727) 345-67-89 · Пн–Сб 09:00–20:00</span>
          <span>© КлючУчёт, 2026</span>
        </div>
      </footer>
    </div>
  );
}
