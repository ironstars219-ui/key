import { Link, useNavigate, useParams } from 'react-router-dom';
import { getOrder, updateOrder } from '../api/orders.api.js';
import { useLoad } from '../utils/useLoad.js';
import OrderForm from '../components/OrderForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function EditOrderPage() {
  const { id } = useParams();
  const go = useNavigate();
  const { data: order, error } = useLoad(() => getOrder(id), [id]);
  const editable = order && ['NEW', 'IN_PROGRESS'].includes(order.status) && order.paymentStatus === 'UNPAID';

  return (
    <div className="stack">
      <div><div className="crumbs"><Link to="/orders">Заказы</Link> / <Link to={`/orders/${id}`}>Заказ № {id}</Link> / Изменить</div><h1>Изменить заказ № {id}</h1></div>
      <ErrorMessage error={error} />
      {order && !editable && <div className="info-box">Этот заказ уже нельзя менять: редактирование доступно в статусах «Новый» и «В работе», пока заказ не оплачен.</div>}
      {editable && (
        <OrderForm
          initial={order}
          submitLabel="Сохранить"
          onSubmit={async (data) => { await updateOrder(id, data); go(`/orders/${id}`); }}
          onCancel={() => go(`/orders/${id}`)}
        />
      )}
    </div>
  );
}
