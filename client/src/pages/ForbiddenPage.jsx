import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
  return (
    <div className="center">
      <h1>Недостаточно прав</h1>
      <p className="muted">Эта страница доступна только администратору.</p>
      <Link to="/" className="btn primary">На главную</Link>
    </div>
  );
}
