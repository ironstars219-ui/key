import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orders.api.js';
import OrderForm from '../components/OrderForm.jsx';

export default function CreateOrderPage() {
  const go = useNavigate();
  return (
    <div className="stack">
      <div><div className="crumbs"><Link to="/orders">Заказы</Link> / Новый заказ</div><h1>Новый заказ</h1></div>
      <OrderForm
        submitLabel="Создать заказ"
        onSubmit={async (data) => go(`/orders/${(await createOrder(data)).id}`)}
        onCancel={() => go('/orders')}
      />
    </div>
  );
}
