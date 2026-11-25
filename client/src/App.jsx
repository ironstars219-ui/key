import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import CreateOrderPage from './pages/CreateOrderPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';
import EditOrderPage from './pages/EditOrderPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import ClientDetailsPage from './pages/ClientDetailsPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<CreateOrderPage />} />
        <Route path="/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/orders/:id/edit" element={<EditOrderPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/stats" element={<ProtectedRoute role="ADMIN"><StatisticsPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/403" element={<ForbiddenPage />} />
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
