import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// role="ADMIN" — страница только для администратора (иначе /403)
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Загрузка…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/403" replace />;
  return children;
}
