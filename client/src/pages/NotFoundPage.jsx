import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NotFoundPage() {
  const { user } = useAuth();
  return (
    <div className="center">
      <h1>Страница не найдена</h1>
      <p className="muted">Проверьте адрес или вернитесь назад.</p>
      <Link to={user ? '/' : '/login'} className="btn primary">{user ? 'На главную' : 'Ко входу'}</Link>
    </div>
  );
}
